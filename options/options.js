const commandName = '_execute_browser_action';
const optionsDefault = {
    options: {
        browserAction: "Ctrl+Shift+L",
        keyComplete: "C",
        keyEdit: "E",
        keyDelete: "D",
        keyNew: "N",
        keyFilter: "?",
    }
}
browser.storage.onChanged = updateUI;

setEventListeners();

async function updateUI() {
    // fetch options values from storage and populate options elements
    let options = await fetchOptions();
    // 1. Get all option settings on the page
    // 2. Populate the values with the stored option value
    // 3. Or get value from optionsDefault structure
    var optionElements = document.querySelectorAll("form input");
    for(let i = 0; i < optionElements.length; i++) {
        let val = options.options[optionElements[i].id];
        optionElements[i].value = typeof val !== "undefined" ? val : optionsDefault.options[optionElements[i].id];
    }
   
    let commands = await browser.commands.getAll();
    for (command of commands) {
      if (command.name === commandName) {
        document.querySelector('#browserAction').value = command.shortcut;
      }
    }
}
  // Update only the shortcut options
  async function updateShortcuts(e) {
    e.preventDefault();  
    let options = await fetchOptions();
    let shortcutOptions = document.querySelectorAll(".shortcutOptions input");
    for(let i = 0; i < shortcutOptions.length; i++) {
        options.options[shortcutOptions[i].id] = shortcutOptions[i].value;
    }
    await browser.storage.sync.set(options);
    
    // commands.update not in Firefox v57 :(
    // await browser.commands.update({
    //   name: commandName,
    //   shortcut: document.querySelector('#browserAction').value
    // });
  }
  
  /**
   * Reset the shortcut and update the textbox.
   */
  async function resetShortcuts(e) {
    let options = await fetchOptions();
    let shortcutOptions = document.querySelectorAll(".shortcutOptions input");
    for(let i = 0; i < shortcutOptions.length; i++) {
        options.options[shortcutOptions[i].id] = optionsDefault.options[shortcutOptions[i].id];
    }
    await browser.storage.sync.set(options);
    e.preventDefault();  
    // commands.update not in Firefox v57 :(
    // await browser.commands.reset(commandName);
  }
  
  async function resetEverything() {
    clearLocalTodos();
    initOptions();
  }

  async function clearLocalTodos() {
      await browser.storage.sync.remove("items");
  }

  async function initOptions() {
    await browser.storage.sync.clear();
    let options = fetchOptions(); // returns default since empty
    await browser.storage.sync.set(options);
}

  async function fetchOptions() {
      let options = await browser.storage.sync.get("options");
      if(typeof options === "undefined" || !options.hasOwnProperty("options")) {
          options["options"] = optionsDefault;
      }
      return options;
  }

  function setEventListeners() {
    document.addEventListener('DOMContentLoaded', updateUI);
  
    document.querySelector('#update').addEventListener('click', updateShortcuts);
    document.querySelector('#reset').addEventListener('click', resetShortcuts);
    document.querySelector('#deleteTodos').addEventListener('click', clearLocalTodos);
    document.querySelector('#resetAll').addEventListener('click', resetEverything);  
  }