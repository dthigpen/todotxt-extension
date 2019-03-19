# todotxt-extension
A keyboard driven to-do list extension with the todo.txt methodology in mind.

### Features
 - Syntax highlighting
 - Multi-criteria sorting
 - To-do filtering
 - Keyboard shortcuts for editing, completing, and viewing tasks

### How to use
 - Make sure the add-on is installed
 - Click on the add-on icon (checked checkbox) or use the keyboard shortcut ```Ctrl+Shift+L```
 - Navigate to-do items with the keyboard shortcuts or mouse
 - View or change the keyboard shortcuts on the Options page (Firefox: ```Ctrl+Shift+A``` -> Add-on Options)
### Keyboard Shortcuts
| Action         | Key               |
|----------------|-------------------|
| Open extension | ```Alt+Shift+L``` |
| Navigation     | ```↑```, ```↓```  |
| New to-do      | ```N```           |
| Complete to-do | ```C```           |
| Edit to-do     | ```E```           |
| Delete to-do   | ```D```           |
| Filter Prefix  | ```?```           |

 ### Testing (Temporary Installation)
  1. Clone the repository to your machine.
  2. Type ```about:debugging``` in the Firefox address bar.
  3. Press the "Load Temporary Add-on" button.
  4. Navigate to the cloned repository location and select the ```manifest.json``` file.

### Development
  The easiest way to get started developing a web extension is using the [web-ext](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Getting_started_with_web-ext), a node-based application that automatically reloads the Firefox extension on file changes.
  1. Install [Nodejs](https://nodejs.org/en/)
  2. Run ```npm install --global web-ext```
  3. ```cd``` into the web extension's root directory
  4. Run ```web-ext run```

### Full Installation
 - Download the latest .xpi or .zip in the Releases tab, and install from file under Firefox's Add-ons page
 - Or search the addons store for the latest published version, which may not be up to date.

### Future Plans
 - File import and export

### Examples
![ExampleUsage](https://github.com/dthigpen/todotxt-extension/blob/master/examples/vid1.gif)
![ExampleUsage](https://github.com/dthigpen/todotxt-extension/blob/master/examples/img1.png)