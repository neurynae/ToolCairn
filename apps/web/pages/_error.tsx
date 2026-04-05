// Minimal error page to prevent Next.js from using its default _error.js
// which imports Html from next/document in a context that fails static prerendering.
function AppError() {
  return null;
}
// biome-ignore lint/style/noDefaultExport: Next.js requires default export for _error
export default AppError;
