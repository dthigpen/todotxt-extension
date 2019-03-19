const commandName = '_execute_browser_action';
const optionsDefault = {
    options: {
        browserAction: "Ctrl+Shift+L",
        keyComplete: "C",
        keyEdit: "E",
        keyDelete: "D",
        keyNew: "N",
        keyFilter: "?",
        dividerShow: false,
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
        if(typeof val !== "undefined") {
          optionElements[i][optionElements[i].type == "checkbox" ? "checked" : "value"] = val;
        } else if(typeof optionsDefault.options[optionElements[i].id] !== "undefined") {
          optionElements[i][optionElements[i].type == "checkbox" ? "checked" : "value"] = optionsDefault.options[optionElements[i].id];
        }
    }
   
    let commands = await browser.commands.getAll();
    for (command of commands) {
      if (command.name === commandName) {
        document.querySelector('#browserAction').value = command.shortcut;
      }
    }
}
  async function resetDividerOptions() {
    let options = await fetchOptions();
    let dividerOptions = document.querySelectorAll(".dividerOptions input");
    for(let i = 0; i < dividerOptions.length; i++) {
        options.options[dividerOptions[i].id] = optionsDefault.options[dividerOptions[i].id];
    }
    await browser.storage.sync.set(options);
  }

  async function updateDividerOptions() {
    let options = await fetchOptions();
    let dividerOptions = document.querySelectorAll(".dividerOptions input");
    for(let i = 0; i < dividerOptions.length; i++) {
        options.options[dividerOptions[i].id] = dividerOptions[i].getAttribute("type") != "checkbox" ? dividerOptions[i].value : dividerOptions[i].checked;
    }
    await browser.storage.sync.set(options);
  }

  // Update only the shortcut options
  async function updateShortcutOptions() {
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
  async function resetShortcutOptions() {
    let options = await fetchOptions();
    let shortcutOptions = document.querySelectorAll(".shortcutOptions input");
    for(let i = 0; i < shortcutOptions.length; i++) {
        options.options[shortcutOptions[i].id] = optionsDefault.options[shortcutOptions[i].id];
    }
    await browser.storage.sync.set(options);
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

async function handleReset(e) {
  let form = e.target.parentNode;
  e.preventDefault();
  if(form.classList.contains("dividerOptions")) {
    await resetDividerOptions();
  } else if(form.classList.contains("shortcutOptions")) {
    await resetShortcutOptions();
  } else if(form.classList.contains("otherOptions")) {
    console.log("TODO reset other options");
  }
  await browser.runtime.reload();
}

  async function handleSave(e) {
    let form = e.target.parentNode;
    e.preventDefault();
    if(form.classList.contains("dividerOptions")) {
      updateDividerOptions();
    } else if(form.classList.contains("shortcutOptions")) {
      updateShortcutOptions();
    } else if(form.classList.contains("otherOptions")) {
      console.log("TODO update other options");
    }
  }

  function setEventListeners() {
    document.addEventListener('DOMContentLoaded', updateUI);
    
    let saveButtons = document.querySelectorAll("form button.save");
    let resetButtons = document.querySelectorAll("form button.reset");

    for(let i = 0; i < saveButtons.length; i++) {
      saveButtons[i].addEventListener('click', handleSave);
    }
    for(let i = 0; i < resetButtons.length; i++) {
      resetButtons[i].addEventListener('click', handleReset);
    }

    document.querySelector('#deleteTodos').addEventListener('click', clearLocalTodos);
    document.querySelector('#resetAll').addEventListener('click', resetEverything);  
  }