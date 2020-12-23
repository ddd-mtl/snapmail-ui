/**
 * Functions for manipulating mailItems
 */

/**
 * All Folders for fileBox
 * @type {{ALL: string, TRASH: string, SENT: string, INBOX: string}}
 */
const systemFolders = {
  ALL: String.fromCodePoint(0x1F4C1) + ' All',
  INBOX: String.fromCodePoint(0x1F4E5) + ' Inbox',
  SENT: String.fromCodePoint(0x1F4E4) + ' Sent',
  TRASH: String.fromCodePoint(0x1F5D1) + ' Trash'
};
module.exports.systemFolders = systemFolders;

/**
 * Return True if mail has been deleted
 */
function isMailDeleted(mailItem) {
  let state = mailItem.state;
  if (state.hasOwnProperty('In')) {
    return state.In === 'Deleted';
  }
  if (state.hasOwnProperty('Out')) {
    return state.Out === 'Deleted';
  }
  console.error('Invalid mailItem object')
  return false;
}
module.exports.isMailDeleted = isMailDeleted;

/**
 * Return True if mail is an OutMail
 */
function is_OutMail(mailItem) {
  let state = mailItem.state;

  if (state.hasOwnProperty('In')) {
    return false;
  }
  if (state.hasOwnProperty('Out')) {
    return true;
  }
  console.error('Invalid mailItem object')
  return false;
}
module.exports.is_OutMail = is_OutMail;

// /**
//  * Return True if mail has been acknoweldged by this agent
//  */
// function hasMailBeenOpened(mailItem) {
//   //console.log('hasMailBeenOpened()? ' + JSON.stringify(mailItem.state));
//   let state = mailItem.state;
//
//   if (state.hasOwnProperty('Out')) {
//     return true;
//   }
//   if (state.hasOwnProperty('In')) {
//     return state.In === 'Acknowledged' || state.In === 'AckReceived' || state.In === 'Deleted';
//   }
//   console.error('Invalid mailItem object')
//   return false;
// }


/**
 *
 * Return mailItem class
 */
function determineMailClass(mailItem) {
  //console.log('determineMailClass()? ' + JSON.stringify(mailItem.state));
  let state = mailItem.state;

  if (state.hasOwnProperty('Out')) {
    switch (state.Out) {
      case 'Pending': return 'pending';
      case 'PartiallyArrived_NoAcknowledgement': return 'partially';
      case 'PartiallyArrived_PartiallyAcknowledged': return 'partially';
      case 'Arrived_NoAcknowledgement': return 'arrived';
      case 'Arrived_PartiallyAcknowledged': return 'arrived';
      case 'Received': return 'received';
      case 'Deleted': return 'deleted';
    }
  }
  if (state.hasOwnProperty('In')) {
    switch(state.In) {
      case 'Acknowledged':return 'received';
      case 'AckReceived': return 'received';
      case 'Arrived':     return 'newmail';
      case 'Deleted':     return 'deleted';
    }
  }
  console.error('Invalid mailItem object');
  return '';
}
module.exports.determineMailClass = determineMailClass;


/**
 *
 * @returns {string}
 */
function customDateString(dateItem) {
  let date = new Date(dateItem);
  let hours = date.getHours();
  let minutes = date.getMinutes();
  if (minutes < 10) {
    minutes = '0' + minutes
  }
  if (hours < 10) {
    hours = '0' + hours
  }
  const dday = date.toDateString() + ', ' + hours + ':' + minutes
  return dday
}


/**
 *
 * @returns {{date: string, subject: Certificate, id: string | (() => AddressInfo) | (() => (AddressInfo | string)) | (() => (AddressInfo | string | null)) | app.address, username: string, status: string}}
 */
function into_gridItem(usernameMap, mailItem) {
  let username = usernameMap.get(mailItem.author)
  let dateStr = customDateString(mailItem.date)
  if (mailItem.state.hasOwnProperty('Out')) {
    username = 'To: ' + usernameMap.get(mailItem.mail.to[0])
  }
  let status = mailItem.mail.attachments.length > 0? String.fromCodePoint(0x1F4CE) : '';
  let item = {
    "id": mailItem.address, "username": username, "subject": mailItem.mail.subject, "date": dateStr, "status": status
  };
  return item;
}
module.exports.into_gridItem = into_gridItem;


/**
 *
 * @returns {string}
 */
function into_mailText(usernameMap, mailItem) {
  let intext = 'Subject: ' + mailItem.mail.subject + '\n\n'
    + mailItem.mail.payload + '\n\n'
    + 'Mail from: ' + usernameMap.get(mailItem.author) + ' at ' + customDateString(mailItem.date);
  let to_line = '';
  for (let item of mailItem.mail.to) {
    to_line += ' ' + usernameMap.get(item);
  }
  let cc_line = '';
  let can_cc = false;
  for (let item of mailItem.mail.cc) {
    cc_line += ' ' + usernameMap.get(item);
    can_cc = true;
  }
  let bcc_line = '';
  let can_bcc = false;
  for (let item of mailItem.bcc) {
    bcc_line += ' ' + usernameMap.get(item);
    can_bcc = true;
  }
  intext += '\nTo: ' + to_line;
  if (can_cc) {
    intext += '\nCC: ' + cc_line;
  }
  if (can_bcc) {
    intext += '\nBCC: ' + bcc_line;
  }

  // Debug info
  if (process.env.NODE_ENV === 'dev') {
    intext += '\n\nDEBUG INFO';
    intext += '\nState: ' + JSON.stringify(mailItem.state);
    intext += '\nAddress: ' + mailItem.address;
    intext += '\nFiles: ' + mailItem.mail.attachments.length;
  }

  return intext;
}
module.exports.into_mailText = into_mailText;
