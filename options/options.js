const commandName = '_execute_browser_action';

browser.storage.onChanged = updateUI;

async function initOptions(force=false) {
    let options = await browser.storage.sync.get("options");
    if(force || typeof options === "undefined" || !options.hasOwnProperty("options")) {
        let options = {
            options: {
                shortcuts: {},
                notifications: {},
                other: {}
            }
        };
        console.log("Reseting options");
        await browser.storage.sync.set(options);
        await resetShortcuts();
    }
}
/**
 * Update the UI: set the value of the shortcut textbox.
 */
async function updateUI() {
    // fetch options values from storage and populate options elements
    let options = await fetchOptions();
    if(typeof options !== "undefined" && typeof options.options !== "undefined") {
        let shortcuts = options.options.shortcuts;
        for(var prop in shortcuts) {
            // skip loop if the property is from prototype
            if (!shortcuts.hasOwnProperty(prop)) continue;
            let foundKey = shortcuts[prop].key;
            if(typeof foundKey === "undefined" || foundKey.length === 0) {
                document.querySelector("#" + prop).value = shortcuts[prop].default;
            } else {
                document.querySelector("#" + prop).value = foundKey;
            }
        }
    } else {
        // reset the options structure
        initOptions(true);
    }
   
    let commands = await browser.commands.getAll();
    for (command of commands) {
      if (command.name === commandName) {
        document.querySelector('#browserAction').value = command.shortcut;
      }
    }
}
  
  /**
   * Update the shortcut based on the value in the textbox.
   */
  async function updateShortcuts(e) {
    e.preventDefault();  
    let options = await fetchOptions();
    let shortcuts = options.options.shortcuts;
    let shortcutOptions = document.querySelectorAll(".shortcutOptions input");
    for(let i = 0; i < shortcutOptions.length; i++) {
        shortcuts[shortcutOptions[i].id].key = shortcutOptions[i].value;
    }
    await browser.storage.sync.set(options);
    await browser.commands.update({
      name: commandName,
      shortcut: document.querySelector('#browserAction').value
    });
  }
  
  /**
   * Reset the shortcut and update the textbox.
   */
  async function resetShortcuts(e) {
    e.preventDefault();
    let shortcuts = {
        browserAction: {
            default: "Ctrl+Shift+L",
            key: "Ctrl+Shift+L"
        },
        keyComplete: {
            default: "C",
            key: "C"
        },
        keyEdit: {
            default: "E",
            key: "E"
        },
    };
    let options = await fetchOptions();
    options.options.shortcuts = shortcuts;
    await browser.storage.sync.set(options);
    await browser.commands.reset(commandName);
  }
  
  async function clearLocalTodos() {
      await browser.storage.sync.remove("items");
  }

  async function fetchOptions() {
      let options = await browser.storage.sync.get("options");
      return options;
  }
  /**
   * Update the UI when the page loads.
   */
  document.addEventListener('DOMContentLoaded', updateUI);
  
  document.querySelector('#update').addEventListener('click', updateShortcuts);
  document.querySelector('#reset').addEventListener('click', resetShortcuts);
  document.querySelector('#deleteTodos').addEventListener('click', clearLocalTodos);
  document.querySelector('#resetAll').addEventListener('click', () => initOptions(true));
  
  initOptions();