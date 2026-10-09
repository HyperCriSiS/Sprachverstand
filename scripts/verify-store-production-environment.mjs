// Prüft öffentlich abrufbare GitHub-Freigaberegeln, ohne etwas zu verändern.
// Fehlende oder unvollständige API-Antworten blockieren jede Store-Einreichung.
const buffers = [];
let bytes = 0;
for await (const part of process.stdin) {
  bytes += part.byteLength;
  if (bytes > 1024 * 1024) {
    console.error("Store-Einreichung gesperrt: Umgebungsantwort zu groß.");
    process.exitCode = 1;
    break;
  }
  buffers.push(part);
}

if (process.exitCode !== 1) {
  try {
    const env = JSON.parse(Buffer.concat(buffers).toString("utf8"));
    if (env?.name !== "store-production") {
      throw new Error("Die erwartete Produktionsumgebung fehlt.");
    }
    // Bei einem einzelnen Maintainer wird die Freigabe ausschließlich durch
    // manuellen Workflow-Dispatch, Eigentümerprüfung und genaue Phrase erteilt.
    // Eine GitHub-Reviewer-Pflicht würde dieses Modell unbenutzbar machen.
    const rules = Array.isArray(env.protection_rules) ? env.protection_rules : [];
    if (rules.some((rule) => rule?.type === "required_reviewers")) {
      throw new Error("Required Reviewers im Einzelentwickler-Modus deaktivieren.");
    }
    if (env.can_admins_bypass !== false) {
      throw new Error("Administrator-Bypass ist nicht deaktiviert.");
    }
    if (env.deployment_branch_policy?.protected_branches !== true ||
        env.deployment_branch_policy?.custom_branch_policies !== false) {
      throw new Error("Die Umgebung ist nicht auf geschützte Branches begrenzt.");
    }
    console.log("Produktionsumgebung und alle Pflichtschutzregeln bestätigt.");
  } catch (error) {
    console.error("Store-Einreichung gesperrt:", error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
