// Minimal error page to prevent Next.js from using its default _error.js
// which imports Html from next/document in a context that fails static prerendering.
function Error() {
  return null;
}
export default Error;
