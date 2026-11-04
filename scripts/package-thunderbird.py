"""Package a committed Thunderbird build, without credentials or upload actions."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parent.parent
GIT = ['git', '-c', 'safe.directory=' + ROOT.as_posix()]


def command(*args):
    return subprocess.check_output(args, cwd=ROOT, text=True).strip()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', default='artifacts/thunderbird-release')
    args = parser.parse_args()
    output = (ROOT / args.output).resolve()
    if not output.is_relative_to(ROOT / 'artifacts'):
        raise SystemExit('Output must stay within artifacts/.')
    output.mkdir(parents=True, exist_ok=True)
    version = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))['version']
    tag = 'thunderbird-v' + version
    commit = command(*GIT, 'rev-parse', 'HEAD')
    source_paths = ['package.json', 'package-lock.json', 'src', 'static', 'manifests',
                    'scripts/build.mjs', 'LICENSE', 'NOTICE', 'TRADEMARKS.md',
                    'docs/THUNDERBIRD-PRIVACY.md']
    subprocess.run([*GIT, 'diff', '--exit-code', 'HEAD', '--', *source_paths], cwd=ROOT, check=True)
    build = ROOT / 'dist/thunderbird'
    manifest = json.loads((build / 'manifest.json').read_text(encoding='utf-8'))
    assert manifest == json.loads((ROOT / 'manifests/thunderbird.json').read_text(encoding='utf-8'))
    assert manifest['version'] == version
    assert manifest['permissions'] == ['storage', 'scripting', 'messagesRead']
    assert manifest['optional_permissions'] == ['compose']
    files = sorted(p for p in build.rglob('*') if p.is_file())
    names = {p.relative_to(build).as_posix() for p in files}
    required = manifest['background']['scripts'] + [manifest['action']['default_popup'],
        manifest['options_ui']['page'], 'compose-ready.js', 'thunderbird-platform-ui.js',
        'options/thunderbird-compose-options.js'] + list(manifest['icons'].values())
    assert all(name in names for name in required)
    assert not any(part in name.split('/') for name in names for part in ['.git', 'node_modules', 'tests'])
    xpi = output / f'sprachverstand-thunderbird-{version}.xpi'
    with zipfile.ZipFile(xpi, 'w', zipfile.ZIP_DEFLATED) as archive:
        for file in files:
            info = zipfile.ZipInfo(file.relative_to(build).as_posix(), (1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, file.read_bytes())
    with zipfile.ZipFile(xpi) as archive:
        assert archive.testzip() is None
        for file in files:
            assert archive.read(file.relative_to(build).as_posix()) == file.read_bytes()
    source = output / f'sprachverstand-thunderbird-{version}-source.zip'
    subprocess.run([*GIT, 'archive', '--format=zip', '--output=' + str(source), 'HEAD', '--', *source_paths], cwd=ROOT, check=True)
    node = command('node', '--version')
    # npm.cmd must be resolved through cmd.exe on Windows; fixed arguments only.
    npm = command('cmd', '/c', 'npm', '--version') if __import__('os').name == 'nt' else command('npm', '--version')
    instructions = f'''# Rebuild Sprachverstand for Thunderbird {version}

Source commit: {commit}
Release tag: {tag}
Release build tools: Node.js {node}, npm {npm}; Python is used only for packaging.
Install Node.js from https://nodejs.org/ (Node.js 24 or newer is required).

Unpack this source archive into an empty directory, then run:

    npm ci
    npm run build:thunderbird

The installable extension contents are in dist/thunderbird/. Zip the CONTENTS
of that directory (manifest.json at archive root) and use the .xpi extension.
Compare unpacked files to the release XPI; ZIP metadata/compression may differ.
No credentials, cloud service or private file is needed for the build.
Test fixtures, node_modules and generated output are intentionally excluded.
'''
    with zipfile.ZipFile(source, 'a', zipfile.ZIP_DEFLATED) as archive:
        archive.writestr('BUILDING.md', instructions)
        archive.writestr('SOURCE_COMMIT.txt', commit + '\n')
        assert archive.testzip() is None
    digest = lambda file: hashlib.sha256(file.read_bytes()).hexdigest()
    provenance = output / 'PROVENANCE.json'
    provenance.write_text(json.dumps({'product': 'thunderbird', 'version': version,
        'tag': tag, 'commit': commit, 'node': node, 'npm': npm,
        'files': {f.name: digest(f) for f in [xpi, source]}}, indent=2) + '\n', encoding='utf-8')
    (output / 'SHA256SUMS').write_text(''.join(f'{digest(f)}  {f.name}\n' for f in [xpi, source, provenance]), encoding='utf-8')
    print(f'Verified Thunderbird {version}: {len(files)} files, source commit {commit}')


if __name__ == '__main__':
    main()
