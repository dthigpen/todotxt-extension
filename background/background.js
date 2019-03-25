fetchOptionsAsync();
var options = {
    openAsPopup: false
}

/* Boarding */
browser.runtime.onInstalled.addListener(async ({reason, temporary }) => {
    // for development use
    if(temporary) {
        return;
    };

    switch(reason) {
        case "install":
            // browser.runtime.openOptionsPage();
            const url = browser.runtime.getURL("https://github.com/dthigpen/todotxt-extension#todotxt-extension");
            await browser.tabs.create({ url, });
            break;
        case "update":
            break;
    }
});

/* File Picker Handler
    Creates dialog to pick todo.txt file and saves to storage
*/
browser.runtime.onMessage.addListener(request => {
    if(request.message == "chooseFile") {
        var fileChooser = document.createElement('input');
        fileChooser.type = 'file';

        fileChooser.addEventListener('change', function () {
            var file = fileChooser.files[0];
            var reader = new FileReader();
            reader.onload = function(e){
                let text = e.srcElement.result || "";
                let texts = text.split("\n");
                saveTodoStrings(texts);

            };
            reader.readAsText(file);
            form.reset();
        });

        /* Wrap it in a form for resetting */
        var form = document.createElement('form');
        form.appendChild(fileChooser);
        fileChooser.click();
    }
});

function saveTodoStrings(texts) {
    if(typeof texts !== "undefined" && texts.length > 0) {
        let todos = {
            "items": texts
        };
        browser.storage.sync.set(todos)
        .then(() => {
            // success
            browser.runtime.sendMessage({message: "fileImport", status: "success"});
        })
        .catch(err => {
            showMessage('Failed to save tasks', 'error');
            console.log(err);
        });
    }
}

/* Command listener */
browser.commands.onCommand.addListener((command) => {
    if(command === "toggle-todo-list") {
        if(options.openAsPopup) {
            browser.browserAction.openPopup();
        } else {
            browser.sidebarAction.open();
            
        }
    }else
    console.log(command);
  });


function fetchOptionsAsync() {
    browser.storage.sync.get("options")
    .then(res => {
        if(typeof res === "undefined" || !res.hasOwnProperty("options")) {
            res["options"] = optionsDefault;
        }
        options = res.options;
        console.log(JSON.stringify(res.options));
        return res.options;
    });
}