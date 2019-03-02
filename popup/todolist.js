// basic syntax highlighting script for todo.txt attributes
const reDue          = /due:(\d{4}-\d{2}-\d{2})/,
    reKeyVal       = /([a-zA-Z]+:[a-zA-Z0-9\-]+)/g,
    reProject      =  /(\+[a-zA-Z0-9]+)/g,
    reContext      = /(@[a-zA-Z]+)/g,
    rePriority     = /(\([A-Z]\))/,
    reCompleted    = /^(x .*)/g;

var actionInput = document.querySelector("#actioninput");
var todolist = document.querySelector("#todolist");
var message = document.querySelector("#message-box");

setEventListeners();
loadTodos();
sortTodos();

function loadTodos() {
    browser.storage.local.get("items")
    .then(todos => {
        if(typeof todos !== "undefined") {
            let texts = todos.items;
            if(typeof texts !== "undefined") {
                for(let i = 0; i < texts.length; i++) {
                    addTodo(texts[i]);
                }
            }
            message.innerHTML = texts;
        }
    })
    .catch(err => {
        console.log(err);
    });
    
}

function saveTodos() {
    let todos = {
        "items": [
        ]
    };
    // let elements = document.querySelectorAll("#todolist li");
    let elements = todolist.children;
    if(typeof elements !== "undefined") {
        for(let i = 0; i < elements.length; i++) {
            todos.items.push(elements[i].innerText);
        }
        browser.storage.local.set(todos)
        .then(() => {
            // success
        })
        .catch(err => {
            showMessage('Failed to load tasks', 'error');
            console.log(err);
        });
    }
}

function reset() {
    todolist.innerHTML = null;
    browser.storage.local.clear();
}
function setEventListeners() {
    actionInput.addEventListener("keyup", function(event) {
        // Number 13 is the "Enter" key on the keyboard
        if (event.keyCode === 13 && this.value.trim().length > 0) {
            if(this.hasAttribute("update")) {
                if(updateTodo(this.value.trim(), this.getAttribute("update"))) {
                    // success
                } else {
                    // Todo with this id is missing so create a new one
                    addTodo(this.value.trim());
                }
            } else {
                addTodo(this.value.trim());
            }
            this.value = "";
        }
        if(this.value.length === 0) {
            this.removeAttribute("update");
        }
      });
}

function addTodo(text) {
    let item = document.createElement("li");
    item.appendChild(document.createTextNode(text));
    todolist.appendChild(item);
    message.innerHTML = text;
    item.addEventListener("click", function(event) {
        toggleCompleteTodo(this);
    });

    sortTodos();
}

function editTodo(item) {
    actionInput.value = item.innerText;
    actionInput.setAttribute("update", item.id);
    actionInput.focus();
}

function updateTodo(text, index) {
    let items = [...todolist.children];
    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        if(typeof item !== "undefined" && item != null) {
            if(item.id === index){
                item.innerText = text.trim();
                sortTodos();
                return true;
            }   
        }
    }
    return false;
}
function deleteTodo(item) {
    item.parentNode.removeChild(item);
    sortTodos();
}

function toggleCompleteTodo(item) {
    if(reCompleted.test(item.innerText)) {
        item.innerText = item.innerText.substring(2);
    } else {
        item.innerText = "x " + item.innerText;
    }
    sortTodos();
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

function sortTodos() {
    var items = [...todolist.children];
    items.sort(sortFunct);
    for (var i = 0; i < items.length; i++) {
        items[i].id = `item${i}`;
        items[i].parentNode.appendChild(items[i]);
    }
    saveTodos();
    performSyntaxHighlighting();
}

function sortFunct(elementA, elementB) {
    reCompleted.lastIndex = 0;
    reDue.lastIndex = 0;
    rePriority.lastIndex = 0;
    reContext.lastIndex = 0;
    reKeyVal.lastIndex = 0;

    var textA = elementA.innerText;
    var textB = elementB.innerText;
    
    var completedA = reCompleted.test(textA);
    var completedB = reCompleted.test(textB);

    var priorityA = rePriority.exec(textA);
    priorityA = priorityA != null ? priorityA[1] : null;
    var priorityB = rePriority.exec(textB);
    priorityB = priorityB != null ? priorityB[1] : null

    var dueA = reDue.exec(textA);
    dueA = dueA != null ?  new Date(dueA[1]) : null;
    var dueB = reDue.exec(textB);
    dueB = dueB != null ?  new Date(dueB[1]) : null;

    var contextA = reContext.exec(textA);
    contextA = contextA != null ?  contextA[1] : null;
    var contextB = reContext.exec(textB);
    contextB = contextB != null ?  contextB[1] : null;

    // console.log(`Item: ${textA}\nCompleted: ${completedA} priority: ${priorityA} due: ${dueA} context: ${contextA}`);
    
    // Sort by completion, then due date, then priority, then context
    
    if(completedA && !completedB) return 1;
    if(!completedA && completedB) return -1;
    if(dueA == null && dueB != null) return 1;
    if(dueA != null && dueB == null) return -1;
    if(dueA != null && dueB != null) {
        if(dueA.getTime() > dueB.getTime()) return 1;
        if(dueA.getTime() < dueB.getTime()) return -1;
    }
    if(priorityA == null && priorityB != null) return 1;
    if(priorityA != null && priorityB == null) return -1;
    if(priorityA != null && priorityB != null) {
        if(priorityA.valueOf() < priorityB.valueOf()) return -1;
        if(priorityA.valueOf() > priorityB.valueOf()) return 1;
    }
    if(contextA == null && contextB != null) return 1;
    if(contextA != null && contextB == null) return -1;
    if(contextA != null && contextB != null){
        if(contextA.valueOf() > contextB.valueOf()) return 1;
        if(contextA.valueOf() < contextB.valueOf()) return -1;
    }
    return 0;
}

function performSyntaxHighlighting() {
    var todoElements = document.querySelectorAll("#todolist li");
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
document.body.onkeyup = function(e) {
    var key = e.keyCode ? e.keyCode : e.which;
    var UP_ARROW = 38,
        DOWN_ARROW = 40,
        ENTER = 13,
        ESCAPE = 27;
    if(todolist.children.length === 0) {
        // showMessage("No tasks!", "error");
        return false;
    }
    if(itemSelected && key >= 65 && key <= 90) {
        // todo item key shortcuts
        if(key == 'C'.charCodeAt(0) || key == 'X'.charCodeAt(0)) {
            toggleCompleteTodo(itemSelected);
        } else if(key == 'E'.charCodeAt(0)) {
            editTodo(itemSelected);
            itemSelected.classList.remove('selected');
            itemSelected = null;
        } else if(key == 'N'.charCodeAt(0)) {
            actionInput.focus();
            itemSelected.classList.remove('selected');
            itemSelected = null;
        } else if(key == 'D'.charCodeAt(0)) {
            deleteTodo(itemSelected);
        }
    } else if(key === ESCAPE) {
        if(itemSelected) {
            itemSelected.classList.remove('selected');
            itemSelected = undefined;
        }
    } else if(key === DOWN_ARROW) {
        actionInput.blur();
        if(itemSelected) {
            itemSelected.classList.remove('selected');
            var next = itemSelected.nextElementSibling;
            if(next !== null && next.parentNode.id === 'todolist') {
                itemSelected = next;
                itemSelected.classList.add('selected');
            } else {
                itemSelected = document.querySelector('#todolist li');
                itemSelected.classList.add('selected');
            }
        } else {
            itemSelected = document.querySelector('#todolist li');
            itemSelected.classList.add('selected');
            itemSelected.focus();
        }
    } else if(key == UP_ARROW) {
        actionInput.blur();
        if(itemSelected) {
            itemSelected.classList.remove('selected');
            var prev = itemSelected.previousElementSibling;
            if(prev !== null && prev.parentNode.id === 'todolist') {
                itemSelected = prev;
                itemSelected.classList.add('selected');
            } else {
                itemSelected = undefined;
                actionInput.focus();
            }
        } else {
            actionInput.focus();
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