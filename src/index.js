import '@vaadin/vaadin-button';
import '@vaadin/vaadin-grid';
import '@vaadin/vaadin-item';
import '@vaadin/vaadin-text-field';
import '@vaadin/vaadin-ordered-layout';
import '@vaadin/vaadin-menu-bar';
// import '@vaadin/vaadin-list-box';
import '@vaadin/vaadin-split-layout';
import '@vaadin/vaadin-combo-box';
import '@vaadin/vaadin-text-field/vaadin-text-area';
import '@vaadin/vaadin-grid/vaadin-grid-column-group';
import '@vaadin/vaadin-grid/vaadin-grid-filter';
import '@vaadin/vaadin-grid/vaadin-grid-filter-column';
import '@vaadin/vaadin-grid/vaadin-grid-tree-toggle';
import '@vaadin/vaadin-grid/vaadin-grid-selection-column';
import '@vaadin/vaadin-grid/vaadin-grid-sort-column';
import '@vaadin/vaadin-grid/vaadin-grid-sorter';
import '@vaadin/vaadin-icons';
import '@vaadin/vaadin-icons/vaadin-icons';

window.addEventListener('load', () => {
  initUi();
});

//var myVar = setInterval(onLoop, 1000);

function onLoop() {
  getAllHandles(handle_handles)
  getAllMails(handle_mails, update_fileBox)
}

function initUi() {
  initMenuBar()
  initApp()
  initFileBox()
  initInMail()
  initOutMail()
  initActionBar()
}

function initApp() {
  // -- App Bar -- //
  getMyHandle(show_handle)

  // -- FileBox -- //
  getAllMails(handle_mails, update_fileBox)

  // -- ContactList -- //
  getAllHandles(handle_handles)
}


function initMenuBar() {
  // Menu -- vaadin-menu-bar
  const menu = document.querySelector('#MenuBar');
  menu.items = [{
    text: 'Reply', disabled: true, children: [{
      text: 'Users', children: [{ text: 'List' }, { text: 'Add' }]
    }, {
      text: 'Billing', children: [{ text: 'Invoices' }, { text: 'Balance Events' }]
    },]
  }, {
    text: 'New', disabled: true, children: [{ text: 'Edit Profile' }, { text: 'Privacy Settings' }]
  }, { text: 'Delete', disabled: true}, { text: 'Get Mails' }, { text: 'Get All Handles' }];
  menu.addEventListener('item-selected', function(e) {
    console.log(JSON.stringify(e.detail.value))
    if (e.detail.value.text === 'Get All Handles') {
      getAllHandles(handle_handles)
    }
    if (e.detail.value.text === 'Get Mails') {
      getAllMails(handle_mails, update_fileBox)
    }
  });
}

function update_mailGrid(folder) {
  const grid = document.querySelector('#mailGrid');
  let folderItems = [];
  console.log('mail_map size: ' + mail_map.values)
  console.log('update_mailGrid: ' + folder);
  switch(folder) {
    case 'All':
      for (mailItem of mail_map.values()) {
        //folderItems = Array.from(mail_map.values());
        folderItems.push(into_gridItem(mailItem));
      }
      break;
    case 'Inbox':
    case 'Sent':
      for (mailItem of mail_map.values()) {
        //console.log('mailItem: ' + JSON.stringify(mailItem))
        let is_out = is_OutMail(mailItem);
        if (is_out && folder == 'Sent') {
          folderItems.push(into_gridItem(mailItem));
          continue;
        }
        if (!is_out && folder == 'Inbox') {
          folderItems.push(into_gridItem(mailItem));
        }
      }
      break;
    case 'Trash':
      break;
    default:
      console.error('Unknown folder')
  }
  const span = document.querySelector('#messageCount');
  console.assert(span);
  span.textContent = folderItems.length;
  console.log('folderItems count: ' + folderItems.length);
  // console.log('folderItems: ' + JSON.stringify(folderItems))
  grid.items = folderItems;
  grid.render();
}

function initFileBox() {
  // Combobox -- vaadin-combo-box
  const systemFolders = ['All', 'Inbox', 'Sent', 'Trash'];
  const folderBoxAll = document.querySelector('#fileboxFolder');
  folderBoxAll.items = systemFolders;
  folderBoxAll.value = systemFolders[1];
  const folderBox = document.querySelector('#fileboxFolder');
  // On value change
  folderBox.addEventListener('change', function(event) {
    update_mailGrid(event.target.value)
  });

  // Filebox -- vaadin-grid
  const mailGrid = document.querySelector('#mailGrid');
  mailGrid.items = [];
  mailGrid.multiSort = true;
  // Display bold if mail not acknowledged
  mailGrid.cellClassNameGenerator = function(column, rowData) {
    let classes = '';
    let mailItem = mail_map.get(rowData.item.id);
    console.assert(mailItem);
    classes += determineMailClass(mailItem);
    // let is_old = hasMailBeenOpened(mailItem);
    // //console.log('answer: ' + is_old);
    // if (!is_old) {
    //   classes += ' newmail';
    // }
    return classes;
  };


  // On item select: Display in inMailArea
  mailGrid.addEventListener('active-item-changed', function(event) {
    const item = event.detail.value;
    contactGrid.selectedItems = item ? [item] : [];
    console.log('mail item: ' + JSON.stringify(item))
    var span = document.getElementById('inMailArea');
    let mail = mail_map.get(item.id)
    span.value = into_mailText(mail);
    acknowledgeMail(item.id, log_result)
    //console.log('mail: ' + JSON.stringify(mail))
  });
}

function initInMail() {
  // inMailArea -- vaadin-text-item
  const inMailArea = document.querySelector('#inMailArea');
  inMailArea.value = '';
}

function initOutMail() {
  // ContactList -- vaadin-grid
  const contactGrid = document.querySelector('#contactGrid');
  contactGrid.items = [];
  contactGrid.addEventListener('active-item-changed', function(event) {
    const item = event.detail.value;
    contactGrid.selectedItems = item ? [item] : [];
    set_SendButtonState(contactGrid.selectedItems.length == 0)
  });
}

function initActionBar() {
  // Action -- vaadin-menu-bar
  const actionMenu = document.querySelector('#ActionBar');
  actionMenu.items = [
      { text: 'Clear' },
      { text: 'Snap', disabled: true },
      { text: 'Send', disabled: true }
    ];
  actionMenu.addEventListener('item-selected', function(e) {
    console.log(JSON.stringify(e.detail.value))
    const outMailSubjectArea = document.querySelector('#outMailSubjectArea');
    const outMailContentArea = document.querySelector('#outMailContentArea');
    if (e.detail.value.text === 'Clear') {
      outMailSubjectArea.value = '';
      outMailContentArea.value = '';
    }
    if (e.detail.value.text === 'Send') {
      const selection = contactGrid.selectedItems;
      if (selection.length > 0) {
        const mail = {
          subject: outMailSubjectArea.value, payload: outMailContentArea.value, to: [selection[0].agentId], cc: [], bcc:[]
        }
        console.log('sending mail: ' + JSON.stringify(mail))
        sendMail(mail, log_result)
        set_SendButtonState(true)
        outMailSubjectArea.value = '';
        outMailContentArea.value = '';
        const contactGrid = document.querySelector('#contactGrid');
        contactGrid.selectedItems = [];
        contactGrid.render()
        getAllMails(handle_mails, update_fileBox)
      } else {
        console.log('Send Mail Failed: No receipient selected')
      }
    }
    });
}

function update_fileBox() {
  const folderBoxAll = document.querySelector('#fileboxFolder');
  update_mailGrid(folderBoxAll.value)
}

function set_SendButtonState(isDisabled) {
  let actionMenu = document.querySelector('#ActionBar');
  actionMenu.items[2].disabled = isDisabled;
  actionMenu.render();
}