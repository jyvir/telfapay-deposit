export function call(url)  {

  window.webkit.messageHandlers.openCasherBank.postMessage({ "params": url});
}
