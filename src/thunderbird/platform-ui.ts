// Keep the shared browser interface, omitting the web-video-only control.
// The shared scripts retain their input reference for settings compatibility.
export {};
const subtitles = document.querySelector<HTMLInputElement>("#process-subtitles");
if (subtitles) {
  subtitles.disabled = true;
  const row = subtitles.closest<HTMLElement>("label");
  if (row) {
    row.hidden = true;
    row.style.display = "none";
  }
}
