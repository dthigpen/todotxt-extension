const exportFileName = "todo.txt";
const exportFileConflictAction = "overwrite";

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
    switch(request.message) {
        case "chooseFile":
            importFromFile();
            break;
        case "exportToFile":
            fetchLocalTodos().then(exportToFile);
            break;
        default:
        console.log("Message not recognized: " + request.message);
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

function importFromFile() {
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

function exportToFile(texts) {
    let data = [];
    for(let i = 0; i < texts.length; i++) {
        let text = texts[i] + (i != texts.length - 1 ? "\n" : "");
        if(text.trim().length > 0) {
            data.push(text);
        }
    }
    let todofile = new Blob(data, {type: "text/plain"});
    browser.downloads.download({
        filename: exportFileName,
        conflictAction: exportFileConflictAction,
        saveAs: true, // TODO catch error if on android and use saveAs: false instead
        url: URL.createObjectURL(todofile)});
}

// Copied from popup/todolist.js
function fetchLocalTodos() {
    return browser.storage.sync.get("items")
    .then(todos => {
        if(typeof todos !== "undefined") {
            let texts = todos.items;
            if(typeof texts !== "undefined") {
                return texts;
            } else {
                return [];
            }
        }
    });
}