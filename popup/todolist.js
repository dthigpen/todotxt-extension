// basic syntax highlighting script for todo.txt attributes
const reDue          = /due:(\d{4}-\d{2}-\d{2})/,
    reKeyVal       = /([a-zA-Z]+:[a-zA-Z0-9\-]+)/g,
    reProject      =  /(\+[a-zA-Z0-9]+)/g,
    reContext      = /(@[a-zA-Z]+)/g,
    rePriority     = /(\([A-Z]\))/,
    reCompleted    = /^(x .*)/;

const scheduledDayRegex = /([a-zA-Z]+:)((?:today)|(?:tomorrow)|(?:monday)|(?:tuesday)|(?:wednesday)|(?:thursday)|(?:friday)|(?:saturday)|(?:sunday)|([0-9]+|one|two|three|four|five|six|seven|eight|nine)-?(day|week|month|year)s?)/ig;
const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const digitValues = ["", "one","two","three","four","five","six","seven","eight","nine"];
const timeUnitsInMs = {
    millisecond: 1,
    second: 1000,
    minute: 60000,
    hour: 3600000,
    day: 86400000,
    week: 604800000,
    month: 2419200000,
    year: 29030400000
};
const optionsDefault = {
        browserAction: "Ctrl+Shift+L",
        keyComplete: "C",
        keyEdit: "E",
        keyDelete: "D",
        keyNew: "N",
        keyFilter: "?",
        dividerShow: false,
};
const htmlElem = document.querySelector("html");
const bodyElem = document.querySelector("body");
const actionInput = document.querySelector("#actioninput");
const actionInputBtn = document.querySelector("#actioninputBtn");
const fileImportBtn = document.querySelector("#fileImportBtn");
const fileExportBtn = document.querySelector("#fileExportBtn");
const optionsBtn = document.querySelector("#optionsBtn");
const todolist = document.querySelector("#todolist");
const message = document.querySelector("#message-box");
const checkWindowWidthDelayMs = 100;
const maxWidth = 550;
const exportFileName = "todo.txt";
const exportFileConflictAction = "overwrite";
const fileReader = new FileReader();

var options = optionsDefault;

// Add method to access created keys
if (!Object.keys) {
    Object.keys = function (obj) {
        var keys = [],
            k;
        for (k in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, k)) {
                keys.push(k);
            }
        }
        return keys;
    };
}

var sortingCriteria = [
    {
        name: "completed",
        compare: function(textA, textB) {
            let completedA = this.match(textA);
            let completedB = this.match(textB);

            if(completedA && !completedB) return 1;
            if(!completedA && completedB) return -1;
            return 0;
        },
        regex: reCompleted,
        match: function(text) {
            resetRegexIndexes();
            return this.regex.test(text);
        }
    },
    {
        name: "due",
        compare: function(textA, textB) {
            let dueA = this.match(textA);
            let dueB = this.match(textB);

            if(dueA == null && dueB != null) return 1;
            if(dueA != null && dueB == null) return -1;
            if(dueA != null && dueB != null) {
                if(dueA.getTime() > dueB.getTime()) return 1;
                if(dueA.getTime() < dueB.getTime()) return -1;
            }
            return 0;
        },
        regex: reDue,
        match: function(text) {
            resetRegexIndexes();
            let dueA = this.regex.exec(text);
            dueA = dueA != null ?  new Date(dueA[1]) : null;
            return dueA;
        }
    },
    {
        name: "priority",
        compare: function(textA, textB) {
            var priorityA = this.match(textA);
            var priorityB = this.match(textB);
            
            if(priorityA == null && priorityB != null) return 1;
            if(priorityA != null && priorityB == null) return -1;
            if(priorityA != null && priorityB != null) {
                if(priorityA.valueOf() < priorityB.valueOf()) return -1;
                if(priorityA.valueOf() > priorityB.valueOf()) return 1;
            }
            return 0;
        },
        regex: rePriority,
        match: function(text) {
            resetRegexIndexes();
            var priorityA = this.regex.exec(text);
            priorityA = priorityA != null ? priorityA[1] : null;
            return priorityA;
        }
    },
    {
        name: "context",
        compare: function(textA, textB) {
            var contextA = this.match(textA);
            var contextB = this.match(textB);

            if(contextA == null && contextB != null) return 1;
            if(contextA != null && contextB == null) return -1;
            if(contextA != null && contextB != null){
                if(contextA.valueOf() > contextB.valueOf()) return 1;
                if(contextA.valueOf() < contextB.valueOf()) return -1;
            }
            return 0;
        },
        regex: reContext,
        match: function(text) {
            resetRegexIndexes();
            let contextA = this.regex.exec(text);
            contextA = contextA != null ?  contextA[1] : null;
            return  contextA;
        }
    }
];

browser.storage.onChanged = fetchOptionsAsync;
fetchOptionsAsync();
setEventListeners();
loadTodos();
sortTodos();
updateBadgeText();

function resetRegexIndexes() {
    reCompleted.lastIndex = 0;
    reDue.lastIndex = 0;
    rePriority.lastIndex = 0;
    reContext.lastIndex = 0;
    reKeyVal.lastIndex = 0;
}

function adjustWindowWidth() {
    let inner = window.innerWidth;
    console.log(inner);
    if(inner < maxWidth) {
        htmlElem.style.width = "100%";
        bodyElem.style.width = "96%";
        console.log("Fit for small displays");
    } else {
        console.log("Fit for large displays");
    }
}

function updateBadgeText() {
    fetchLocalTodos()
    .then(texts => {
        let counter = 0;
        let badgeText = "";
        for(let i = 0; i < texts.length; i++) {
            if(!reCompleted.test(texts[i]) && reDue.exec(texts[i]) != null) {
                counter += 1;
            }
        }
        badgeText = counter > 0 ? counter + "" : "";
        browser.browserAction.setBadgeText({text: badgeText});
    })
    .catch(err => {
        console.error(err);
    });
}

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

function loadTodos() {
    fetchLocalTodos()
    .then(texts => {
        clearTodos();
        for(let i = 0; i < texts.length; i++) {
            addTodo(texts[i], false);
        }
    })
    .catch(err => {
        console.log(err);
    });
}

function clearTodos() {
    todolist.innerHTML = "";
}

function saveTodoStrings(texts, updateUIAfterSave = false) {
    if(typeof texts !== "undefined" && texts.length > 0) {
        let todos = {
            "items": texts
        };
        browser.storage.sync.set(todos)
        .then(() => {
            // success
            if(updateUIAfterSave) {
                loadTodos();
            }
        })
        .catch(err => {
            showMessage('Failed to save tasks', 'error');
            console.log(err);
        });
    }
}

function saveTodos() {
    let items = [];
    let elements = getTodoListItems();
    if(typeof elements !== "undefined") {
        for(let i = 0; i < elements.length; i++) {
            items.push(elements[i].innerText);
        }
        saveTodoStrings(items);
    }
    updateBadgeText();
}

function reset() {
    todolist.innerHTML = null;
    browser.storage.sync.clear();
}
function setEventListeners() {
    document.addEventListener("DOMContentLoaded", () => setTimeout(adjustWindowWidth, checkWindowWidthDelayMs));
    document.body.onkeyup = itemNavigation;
    actionInput.addEventListener("keyup", submitInput);
    actionInputBtn.addEventListener("click", parseActionInput);
    fileImportBtn.addEventListener("click", importFromFile);
    fileExportBtn.addEventListener("click", exportToFile);
    optionsBtn.addEventListener("click", () => browser.runtime.openOptionsPage());
    document.body.querySelector("#todolist").addEventListener("click", todoItemClicked);
    fileReader.addEventListener("loadend", parseImportFile);
    browser.runtime.onMessage.addListener(request => {
        if(request.message == "fileImport" && request.status == "success") {
            loadTodos();
        }
    });
}

function importFromFile() {
    browser.runtime.sendMessage({message: "chooseFile"});
}

function parseImportFile(e) {
    let text = e.srcElement.result || "";
    let texts = text.split("\n");
    saveTodoStrings(texts, true);
}

function exportToFile() {
    sortTodos();
    let items = getTodoListItems() || [];
    let data = [];
    for(let i = 0; i < items.length; i++) {
        let text = items[i].innerText + (i != items.length - 1 ? "\n" : "");
        if(text.trim().length > 0) {
            data.push(text);
        }
    }
    let todofile = new Blob(data, {type: "text/plain"});
    browser.downloads.download({
        filename: exportFileName,
        conflictAction: exportFileConflictAction,
        url: URL.createObjectURL(todofile)});
}

function todoItemClicked(e) {
    let target = e.target;
    if(target.classList.contains("completeTodo") && target.parentNode.parentNode.tagName.toLowerCase() === "li") {
        toggleCompleteTodo(target.parentNode.parentNode);
        hideActionForItems();
    } else if(target.classList.contains("editTodo") && target.parentNode.parentNode.tagName.toLowerCase() === "li") {
        editTodo(target.parentNode.parentNode);
        hideActionForItems();
    } else if(target.classList.contains("deleteTodo") && target.parentNode.parentNode.tagName.toLowerCase() === "li") {
        deleteTodo(target.parentNode.parentNode);
        hideActionForItems();
    } else if(target.classList.contains("text") && target.parentNode.tagName.toLowerCase() === "li") {
        showActionsForItem(target.parentNode);
    }
    e.stopPropagation();
}

function hideActionForItems() {
    let items = getTodoListItems();
    for(let i = 0; i < items.length; i++) {
        items[i].classList.remove("showActions");
    }
}

function showActionsForItem(item) {
    hideActionForItems();
    item.classList.add("showActions")
}

function submitInput(event) {
    event.preventDefault();
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13 && actionInput.value.trim().length > 0) {
        hideActionForItems();
        parseActionInput();
    }
    if(actionInput.value.length === 0) {
        hideActionForItems();
        actionInput.removeAttribute("update");
        actionInputBtn.innerText = "Add";
        removeFilter();
    }
}

function parseActionInput() {
    let inputValue = actionInput.value.trim();
    if(inputValue.length == 0) {
        return
    }
    if(actionInput.hasAttribute("update")) {
        if(updateTodo(inputValue, actionInput.getAttribute("update"))) {
            // success
        } else {
            // Todo with this id is missing so create a new one
            addTodo(inputValue);
        }
    } else if(inputValue.charAt(0) == options.keyFilter) {
        performFilter(inputValue.substring(1));
        return;
    } else {
        addTodo(inputValue);
    }
    actionInput.value = "";
    if(actionInput.value.length === 0) {
        actionInput.removeAttribute("update");
        actionInputBtn.innerText = "Add";
        removeFilter();
    }
}

// Perform an AND filter where all todo items must meet all requirements in the filter
function performFilter(filterText) {
    let filters = filterText.split(" ");
    let items = getTodoListItems();
    actionInputBtn.innerText = "Filter";
    filterText = convertKeyValueDays(filterText);
    for(let i = 0; i < items.length; i++) {
        items[i].classList.remove("hidden");
        let isMatch = true;
        for(let j = 0; isMatch && j < filters.length; j++) {
            if(items[i].innerText.indexOf(filters[j]) == -1) {
                items[i].classList.add("hidden");
                isMatch = false;
            }
        }
    }
}

function removeFilter() {
    let items = getTodoListItems();
    for(let i = 0; i < items.length; i++) {
        items[i].classList.remove("hidden");
    }
}
function convertKeyValueDays(text) {
    scheduledDayRegex.lastIndex = 0;
    return (typeof text !== 'undefined') ? text.replace(scheduledDayRegex,replaceFunct) : '';
  }

function replaceFunct(match,p1,p2, p3,p4) {
    var params = [match,p1,p2,p3,p4];
    if(typeof params[3] !== 'undefined' && typeof params[4] !== 'undefined') {
        multiplier = digitValues.indexOf(params[3]);
        dateFound = new Date(Date.now() + (multiplier * timeUnitsInMs[params[4]]));
        return params[1] + dateToString(dateFound)
    } else if(params[2] == 'today') {
        return params[1] + dateToString(new Date(Date.now()));
    } else if(params[2] == 'tomorrow') {
        return params[1] + dateToString(new Date(Date.now() + timeUnitsInMs["day"]));
    } else {
        var dayIndex = days.indexOf(params[2].toLowerCase());
        if(dayIndex >= 0) {
        var dayDiff = dayIndex - new Date(Date.now()).getDay();
        var daysTill = dayDiff >= 0 ? dayDiff : 7 + dayDiff;
        return params[1] + dateToString(new Date(Date.now() + (daysTill * timeUnitsInMs["day"])));
        }
        return params[0];
    }
}

function createTodoElement(text) {
    text = convertKeyValueDays(text);
    let item = document.createElement("li");
    item.className = "item";
    let textElement = document.createElement("div");
    let actionsElement = document.createElement("div");
    textElement.className = "text";
    textElement.appendChild(document.createTextNode(text));
    let completeBtn = document.createElement("button");
    completeBtn.className="completeTodo";
    completeBtn.innerHTML = '<i class="fas fa-check"></i>';
    let editBtn = document.createElement("button");
    editBtn.className = "editTodo";
    editBtn.innerHTML = '<i class="fas fa-pencil-alt"></i>';
    let deleteBtn = document.createElement("button");
    deleteBtn.className = "deleteTodo";
    deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
    actionsElement.className = "actions";
    // For some reason click listeners do not work when added to the buttons here
    actionsElement.appendChild(completeBtn);
    actionsElement.appendChild(editBtn);
    actionsElement.appendChild(deleteBtn);
    item.appendChild(textElement);
    item.appendChild(actionsElement);
    return item;
}

function editTodoElement(item, editedText) {
    editedText = convertKeyValueDays(editedText);
    let textElement = item.querySelector(".text");
    textElement.innerText = editedText;
}

function addTodo(text, saveAfterAdd = true) {
    let item = createTodoElement(text);
    todolist.appendChild(item);
    sortTodos();
    setTimeout(function() {
        item.classList.add("show");
    },10);
    if(saveAfterAdd) {
        saveTodos();
    }
}

function editTodo(item) {
    actionInput.value = item.innerText;
    actionInput.setAttribute("update", item.id);
    actionInput.focus();
    actionInputBtn.innerText = "Edit";
}

function updateTodo(text, index, saveAfterUpdate = true) {
    let items = getTodoListItems();
    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        if(typeof item !== "undefined" && item != null) {
            if(item.id === index){
                editTodoElement(item, text);
                sortTodos();
                if(saveAfterUpdate) {
                    saveTodos();
                }
                return true;
            }   
        }
    }
    return false;
}
function deleteTodo(item) {
    item.parentNode.removeChild(item);
    saveTodos();
    sortTodos();
}

function toggleCompleteTodo(item, saveAfterUpdate = true) {
    if(reCompleted.test(item.innerText)) {
        editTodoElement(item, item.innerText.substring(2));
    } else {
        editTodoElement(item, "x " + item.innerText);
    }
    sortTodos();
    if(saveAfterUpdate) {
        saveTodos();
    }
}

function showMessage(text, type='success') {
    message.innerHTML = text;
    message.classList.remove("info");
    message.classList.remove("warning");
    message.classList.remove("success");
    message.classList.remove("error");
    message.classList.remove("hidden");
    message.classList.add(type);
    setTimeout(() => message.classList.add("hidden"), 2000);
}

function getTodoListItems() {
    return document.querySelectorAll("#todolist li.item");
}

function createDividerElement(text) {
    let item = document.createElement("li");
    item.className = "divider";
    let textElement = document.createElement("div");
    textElement.className = "text";
    textElement.innerHTML = '<i class="fas fa-angle-down"></i><i>  </i>';
    textElement.appendChild(document.createTextNode(text));
    item.appendChild(textElement);
    return item;
}

function removeDividers() {
    let dividers = document.querySelectorAll("#todolist li.divider");
    for(let i = 0; i < dividers.length; i++) {
        dividers[i].parentNode.removeChild(dividers[i]);
    }
}

function insertDividers(itemsNodeList) {
    let items = [...itemsNodeList];
    let dividerValues = {};
    const maxDividersOfType = 5;
    let itemsWithDividers = {};

    for(let i = 0; i < sortingCriteria.length; i++) {
        var criteria = sortingCriteria[i];
        // ex. criteria = "due" or "completed"
        // create or reference criteria name
        dividerValues[criteria.name] = dividerValues[criteria.name] || {};
        dividerValues[criteria.name]["values"] = dividerValues[criteria.name]["values"] || {};

        // loop through items to find matches of this criteria
        for(let j = 0; j < items.length; j++) {
            let item = items[j];
            
            // create or reference a value for that criteria name
            let valueForCriteria = criteria.match(item.innerText);
            
            if(valueForCriteria == null) {
                continue;
            }
            if(valueForCriteria instanceof Date) {
                valueForCriteria = dateToString(valueForCriteria);

            }
            if(valueForCriteria !== "") {
                // if under maximum dividers of this type then create or access this divider name
                if(Object.keys(dividerValues[criteria.name]["values"]).length < maxDividersOfType) {
                    dividerValues[criteria.name]["values"][valueForCriteria] = dividerValues[criteria.name]["values"][valueForCriteria] || {items: [], show: true, minCount: 2, alias: ""};
                    // add the item to the list if it doesn't contain it already
                    if(dividerValues[criteria.name]["values"][valueForCriteria].items.indexOf(item.id) < 0) {
                        dividerValues[criteria.name]["values"][valueForCriteria].items.push(item.id);
                    }                   
                }
                
            }
        }
    }
    // Special Settings
    dividerValues["completed"] = dividerValues["completed"] || {};
    dividerValues["completed"]["values"] = dividerValues["completed"]["values"] || {};
    dividerValues["completed"]["values"]["true"] = dividerValues["completed"]["values"]["true"] || {};
    dividerValues["completed"]["values"]["false"] = dividerValues["completed"]["values"]["false"] || {};
    dividerValues["completed"]["values"]["false"]["alias"] = "Incomplete";
    dividerValues["completed"]["values"]["true"].show = true;
    dividerValues["completed"]["values"]["true"]["alias"] = "Complete";
    dividerValues["completed"]["values"]["true"].minCount = 1;

    // console.log(JSON.stringify(dividerValues));

    // create dividers for categories if needed
    // First loop through divider categories
    // Then loop through the different values that that attribute can take on
    // Then view ids of items that have that same attribute value
    for(let i = 0; i < sortingCriteria.length; i++) {
        var criteria = sortingCriteria[i];
        let criteriaDividers = dividerValues[criteria.name];
        let criteriaValueKeys = Object.keys(criteriaDividers["values"]);
        for(let j = 0; j < criteriaValueKeys.length; j++) {
            let dividerInfo = criteriaDividers["values"][criteriaValueKeys[j]];
            dividerInfo.items = dividerInfo.items || [];
            if(dividerInfo.show && dividerInfo.items.length >= dividerInfo.minCount) {
                let dividerElement = createDividerElement(dividerInfo.alias != "" ? dividerInfo.alias : criteriaValueKeys[j]);
                let topElement = document.getElementById(dividerInfo.items[0]);
                topElement.insertAdjacentElement("beforebegin", dividerElement);
                dividerInfo.items.forEach(itemId => {
                    itemsWithDividers[itemId] = true;
                });
                setTimeout(function() {
                    dividerElement.classList.add("show");
                },10);
            }
        }
    }
}

function sortTodos() {
    removeDividers();
    var items = [...getTodoListItems()];
    items.sort(sortFunct);
    for (var i = 0; i < items.length; i++) {
        items[i].id = `item${i}`;
        items[i].parentNode.appendChild(items[i]);
    }
    performSyntaxHighlighting();
    if(options.dividerShow === true)
        insertDividers(items);
}

function sortFunct(elementA, elementB) {
    resetRegexIndexes();
    var textA = elementA.innerText;
    var textB = elementB.innerText;

    for(let i = 0; i < sortingCriteria.length; i++) {
        let criteria = sortingCriteria[i];
        let result = criteria.compare(textA, textB);
        if(i < sortingCriteria.length - 1 && result != 0) {
            return result;
        }
    }
    return 0;
}

function dateToString(date) {
    if(date != null) {
        return date.toISOString().substring(0,10);
    }
    return "";
}

function performSyntaxHighlighting() {
    var todoElements = document.querySelectorAll("#todolist li .text");
    for (var i = 0; i < todoElements.length; ++i) {
        var str = todoElements[i].innerHTML.trim();
        parsed = str.replace(reCompleted, '<span class="color-completed">$1</span>');
        parsed = parsed.replace(reKeyVal, '<span class="color-kvpair">$1</span>');
        parsed = parsed.replace(reProject, '<span class="color-project">$1</span>');
        parsed = parsed.replace(reContext, '<span class="color-context">$1</span>');
        parsed = parsed.replace(rePriority, '<span class="color-priority">$1</span>');
        todoElements[i].innerHTML = parsed;
    }
}

// Keyboard navigation of tasks
var itemSelected;


function itemNavigation(e) {
    var key = e.keyCode ? e.keyCode : e.which;
    var UP_ARROW = 38,
        DOWN_ARROW = 40,
        ENTER = 13,
        ESCAPE = 27;

    if(itemSelected && key >= 65 && key <= 90) {
        if(key == options.keyComplete.charCodeAt(0)) {
            toggleCompleteTodo(itemSelected);
        } else if(key == options.keyEdit.charCodeAt(0)) {
            editTodo(itemSelected);
            itemSelected.classList.remove('selected');
            itemSelected = null;
        } else if(key == options.keyNew.charCodeAt(0)) {
            actionInput.focus();
            itemSelected.classList.remove('selected');
            itemSelected = null;
        } else if(key == options.keyDelete.charCodeAt(0)) {
            var next = getNextItem(itemSelected);
            let prev = getPreviousItem(itemSelected);
            deleteTodo(itemSelected);
            itemSelected = prev || next;
        }
    } else if(key === ESCAPE) {
        if(itemSelected) {
            itemSelected.classList.remove('selected');
            itemSelected = undefined;
            actionInput.focus();
        }
    } else if(key === DOWN_ARROW) {
        itemSelected = getNextItem(itemSelected);
        if(itemSelected != null) {
            actionInput.blur();
        } else {
            actionInput.focus();
        }
    } else if(key == UP_ARROW) {
        itemSelected = getPreviousItem(itemSelected);
        if(itemSelected == null) {
            actionInput.focus();
        } else {
            actionInput.blur();
        }
    } else if(key === ENTER) {
        if(itemSelected && itemSelected.classList.contains('selected')) {
            editTodo(itemSelected);
            itemSelected.classList.remove('selected');
            itemSelected = undefined;
        }
    }
    return true;
}

function getNextItem(itemSelected) {
    let selector = ".item";
    if(itemSelected == null) {
        itemSelected = document.querySelector("#todolist " + selector) || null;
        if(itemSelected != null) {
            itemSelected.classList.add("selected");
        }
        return itemSelected;
    }
    itemSelected.classList.remove('selected');
    let next = itemSelected.nextElementSibling;

    while(next && next.parentNode.id == "todolist") {
        if(next.matches(selector)) {
            next.classList.add('selected');
            return next;
        }
        next = next.nextElementSibling;
    }
    itemSelected = document.querySelector("#todolist " + selector) || null;
    if(itemSelected != null) {
        itemSelected.classList.add("selected");
    }
    return itemSelected;
}

function getPreviousItem(itemSelected) {
    let selector = ".item";
    if(itemSelected == null) {
        return null;
    }
    itemSelected.classList.remove('selected');
    let prev = itemSelected.previousElementSibling;
    while(prev && prev.parentNode.id == "todolist") {
        if(prev.matches(selector)) {
            prev.classList.add('selected');
            return prev;
        }
        prev = prev.previousElementSibling;
    }
    return null;
}