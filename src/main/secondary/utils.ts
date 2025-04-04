import { BrowserWindow } from 'electron';

// export const injectHighlightCSS = (): void => {
//   console.log('Injecting highlight CSS...');
//   const style = document.createElement('style');
//   style.textContent = `
//         body select, body input, body textarea {
//             outline: 4px solid rgba(255, 165, 0, 0.5) !important;
//         }
//     `;
//   document.head.appendChild(style);
// };

// export const injectHighlightCSS = (): void => {
//   console.log('Injecting highlight CSS...');
//   const css = (frameID?: string): string => `
//       <!-- injected into ${frameID ?? 'main'} ${frameID ? 'iframe' : 'document'} -->
//       body select, body input, body textarea {
//         outline: 4px solid rgba(255, 165, 0, 0.5) !important;
//       }
//     `;

//   // Inject into the main document
//   const style = document.createElement('style');
//   style.textContent = css();
//   document.head.appendChild(style);

//   // Inject into iframe documents
//   const injectCSSIntoFrames = (): void => {
//     const iframes = document.querySelectorAll('iframe');
//     iframes.forEach((iframe) => {
//       try {
//         const iframeDocument = iframe.contentDocument || (iframe.contentWindow as Window)?.document;
//         if (iframeDocument) {
//           const iframeStyle = iframeDocument.createElement('style');
//           iframeStyle.textContent = css(iframe.id || iframe.src);
//           iframeDocument.head.appendChild(iframeStyle);
//           console.log('Injected highlight CSS into iframe:', iframe.id || iframe.src);
//         }
//       } catch (error) {
//         console.error('Error injecting highlight CSS into iframe:', iframe.src, error);
//       }
//     });
//   };

//   injectCSSIntoFrames();
// };

export const injectHighlightCSS = (): void => {
  console.log('Injecting highlight CSS...');
  const css = (frameID?: string): string => `
        <!-- injected into ${frameID ?? 'main'} ${frameID ? 'iframe' : 'document'} -->
      body select, body input, body textarea {
        outline: 4px solid rgba(255, 165, 0, 0.5) !important;
      }
    `;

  // Inject into the main document
  const style = document.createElement('style');
  style.textContent = css();
  document.head.appendChild(style);

  // Function to inject CSS into a single iframe
  const injectCSSIntoIframe = (iframe: HTMLIFrameElement): void => {
    try {
      const iframeDocument = iframe.contentDocument || (iframe.contentWindow as Window)?.document;
      if (iframeDocument && !iframeDocument.querySelector('style[data-injected-highlight]')) {
        const iframeStyle = iframeDocument.createElement('style');
        iframeStyle.textContent = css(iframe.id || iframe.src);
        iframeStyle.dataset.injectedHighlight = 'true';
        iframeDocument.head.appendChild(iframeStyle);
        console.log('Injected highlight CSS into iframe:', iframe.id || iframe.src);
      }
    } catch (error) {
      console.error('Error injecting highlight CSS into iframe:', iframe.src, error);
    }
  };

  // Function to inject CSS into all current iframes
  //   const injectCSSIntoFrames = (): void => {
  //     const iframes = document.querySelectorAll('iframe');
  //     iframes.forEach(injectCSSIntoIframe);
  //   };

  //   // Initial injection
  //   injectCSSIntoFrames();

  // Set up MutationObserver to watch for added iframe elements
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLIFrameElement) {
            injectCSSIntoIframe(node);
          } else if (node instanceof Element) {
            // Check for iframes within newly added elements (e.g., if a container with iframes is added)
            node.querySelectorAll('iframe').forEach(injectCSSIntoIframe);
          }
        });
      }
    }
  });

  // Start observing the document body for changes to its children
  observer.observe(document.body, { childList: true, subtree: true });

  // Optionally, you might disconnect the observer if you know no more iframes will be added
  // observer.disconnect();
};

export const handleLogin = (username: string, password: string): void => {
  console.log('Attempting login automation...');
  interface InputEventOptions {
    bubbles: boolean;
    cancelable: boolean;
  }

  const typeIntoInput = (selector: string, text: string): void => {
    const input = document.querySelector(selector) as HTMLInputElement | null;
    if (input) {
      input.focus();
      input.value = text;
      const inputEvent = new Event('input', {
        bubbles: true,
        cancelable: true,
      } as InputEventOptions);
      input.dispatchEvent(inputEvent);
      input.dispatchEvent(
        new Event('change', { bubbles: true, cancelable: true } as InputEventOptions),
      );
      console.log(`Typed '${text}' into ${selector}`);
    } else {
      console.log(`Input element with selector '${selector}' not found.`);
    }
  };

  setTimeout(() => {
    try {
      const popup = document.querySelector('#browserCheckerMessage');
      if (popup) {
        popup.remove();
        console.log('Popup div removed after 500ms.');
      } else {
        console.log('Popup div not found after 500ms.');
      }

      typeIntoInput('#username', username);
      typeIntoInput('#password', password);
      const button = document.querySelector('#mainButton') as HTMLButtonElement | null;
      if (button) {
        button.click();
        console.log('Clicked the main button.');
      } else {
        console.log('Main button not found.');
      }
    } catch (e) {
      console.log('Error occurred while automating login:', e);
    }
  }, 500);
};

// Define a generic function type that takes any number of arguments and returns void
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RendererFunction<T extends any[]> = (...args: T) => void | (() => void);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExecuteScript<T extends any[]> = (
  window: BrowserWindow | null,
  func: RendererFunction<T>,
  ...args: T[]
) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const executeScript: ExecuteScript<any> = (window, func, ...args): void => {
  if (!window || window.isDestroyed()) {
    return;
  }

  const functionString = `(${func}).apply(null, ${JSON.stringify(args)})`;

  window!.webContents.executeJavaScript(functionString).catch((error) => {
    console.error('Error executing script in renderer:', error);
  });
};

export const interactWithIframe = (): void => {
  setTimeout(() => {
    let count = 0;
    const interval = setInterval(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        code: 'Tab',
        keyCode: 9,
        charCode: 0,
        bubbles: true,
        cancelable: true,
      });
      document.body.dispatchEvent(event);
      console.log('Dispatched Tab key event');
      count++;
      if (count >= 10) {
        clearInterval(interval);
        console.log('Stopped dispatching Tab key events after 10 iterations.');
      }
    }, 1000);
  }, 5000);
};
