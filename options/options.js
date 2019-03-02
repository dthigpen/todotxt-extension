const commandName = '_execute_browser_action';
/**
 * Update the UI: set the value of the shortcut textbox.
 */
async function updateUI() {
    // fetch options values from storage and populate options elements
    browser.storage.local.get("options")
    .then(options => {
        options = options.options;
        if(typeof options !== undefined) {
            let shortcuts = options.shortcuts;
            for(var prop in shortcuts) {
                // skip loop if the property is from prototype
                if (!shortcuts.hasOwnProperty(prop)) continue;
                let foundKey = shortcuts[prop].key;
                console.log(shortcuts[prop]);
                if(typeof foundKey === "undefined" || foundKey.length == 0) {
                    document.querySelector("#" + prop).value = shortcuts[prop].default;
                } else {
                    document.querySelector("#" + prop).value = foundKey;
                }
            }
        }
    })
    .catch(err => {
        console.error(err);
    });

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
  async function updateShortcut() {
    let options = {
        options: {
            shortcuts: {
                browserAction: {
                    default: "Ctrl+Shift+L",
                    key: ""
                },
                keyComplete: {
                    default: "C",
                    key: ""
                },
                keyEdit: {
                    default: "E",
                    key: ""
                },
            }
        }
    };
    let shortcuts = options.options.shortcuts;
    for(var prop in shortcuts) {
        if (!shortcuts.hasOwnProperty(prop)) continue;
        let inputKey = document.querySelector("#" + prop).value;
        console.log("saving: " + inputKey);
        shortcuts[prop].key = inputKey.length > 0 ? inputKey : shortcuts[prop].default;
    }
    browser.storage.local.set(options);
    
    await browser.commands.update({
      name: commandName,
      shortcut: document.querySelector('#browserAction').value
    });
  }
  
  /**
   * Reset the shortcut and update the textbox.
   */
  async function resetShortcut() {
    let options = {
        options: {
            shortcuts: {
                browserAction: {
                    default: "Ctrl+Shift+L",
                    key: ""
                },
                keyComplete: {
                    default: "C",
                    key: ""
                },
                keyEdit: {
                    default: "E",
                    key: ""
                },
            }
        }
    };
    browser.storage.local.set(options);
    await browser.commands.reset(commandName);
    updateUI();
  }
  
  async function clearLocalTodos() {
      await browser.storage.local.remove("items");
  }

  /**
   * Update the UI when the page loads.
   */
  document.addEventListener('DOMContentLoaded', updateUI);
  
  document.querySelector('#update').addEventListener('click', updateShortcut);
  document.querySelector('#reset').addEventListener('click', resetShortcut);
  document.querySelector('#deleteTodos').addEventListener('click', clearLocalTodos);