export function call(url)  {
  window['webkit']&&window['webkit'].messageHandlers.openCasherBank.postMessage({ "params": url});
}
