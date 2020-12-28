
import { AdminWebsocket, AppWebsocket } from '@holochain/conductor-api';

const TIMEOUT = 6000

const ADMIN_PORT = 1234
const APP_PORT = 8888

var g_adminWs = undefined;
var g_newKey = undefined;
var g_appId = undefined
var g_cellId = undefined
var g_cellNick = undefined
var g_appClient = undefined

const receiveSignal = (signal/*: AppSignal*/) => {
  // impl...
  console.log({signal})
  resolve()
}

// -- CONNECT TO ADMIN -- //

/**
 *
 * @returns {Promise<void>}
 */
export async function rsmConnect() {
   g_adminWs = await AdminWebsocket.connect(`ws://localhost:${ADMIN_PORT}`, TIMEOUT)
  console.log('*** Connected to RSM Admin: ' + JSON.stringify(g_adminWs))
  g_adminWs.generateAgentPubKey().then((newKey) => {
      g_newKey = newKey
      console.log({newKey})
      printAdmin()
  })

  // -- CONNECT TO APP -- //

  g_appClient = await AppWebsocket.connect(`ws://localhost:${APP_PORT}`, TIMEOUT, receiveSignal);

  console.log('*** Connected to Snapmail app: ' + JSON.stringify(g_appClient))
  const appInfo = await g_appClient.appInfo({ installed_app_id: 'test-app' }, 1000)
  console.log({appInfo})
  g_cellId = appInfo.cell_data[0][0];
  console.log({g_cellId})
  dumpState(g_cellId)

  // let result = await g_appClient.callZome({
  //   cap: null,
  //   cell_id: g_cellId,
  //   zome_name: 'snapmail',
  //   fn_name: 'set_handle',
  //   provenance: g_cellId[1],
  //   payload: 'toto',
  // }, 30000)
  // console.log('set_handle() result')
  // console.log({result})
  //
  // result = await g_appClient.callZome({
  //   cap: null,
  //   cell_id: g_cellId,
  //   zome_name: 'snapmail',
  //   fn_name: 'get_my_handle',
  //   //provenance: g_newKey,
  //   provenance: g_cellId[1],
  //   payload: undefined,
  // }, 30000)
  // console.log('get_my_handle() result')
  // console.log({result})
}

/**
 *
 */
const printAdmin = () => {
  console.log("printAdmin:")
  g_adminWs.listDnas().then((dnaList) => {
    console.log({dnaList})
  })
  g_adminWs.listCellIds().then((cellList) => {
    console.log({cellList})
  })
  g_adminWs.listActiveApps().then((appList) => {
    console.log({appList})
  })
}

/**
 *
 */
const dumpState = (cellId) => {
  if (g_adminWs === undefined) {
    console.log('dumpState() Error: g_adminWs undefined')
    return
  }
  g_adminWs.dumpState({cell_id: cellId}).then((stateDump) => {
    console.log('stateDump of cell:')
    console.log({stateDump})
  })
}
//module.exports.dumpState = dumpState;

// ConductorApi.AppWebsocket.connect('ws://localhost:8888').then(
//   async appWebsocket => {
//     const appInfo = await appWebsocket.appInfo({
//       installed_app_id: 'test-app',
//     });
//     const cellId = appInfo.cell_data[0][0];
//     const context = document.getElementById('provider');
//     context.appWebsocket = appWebsocket;
//     context.cellId = cellId;
//   }
// )

/**
 *
 */
export const callDna = (functionName, payload, signalCallback) => {
  return new Promise((succ, err) => {
    if (g_appClient === undefined) {
      console.error("App Client Websocket not connected!")
    }
    return g_appClient.callZome({
      cap: null,
      cell_id: g_cellId,
      zome_name: "snapmail",
      fn_name: functionName,
      provenance: g_cellId[1],
      payload: payload,
    }, 30000) // default timeout set here (30000) will overwrite the defaultTimeout(12000) set above
  })
}
//exports.callDna = callDna;

// -- Handle -- //

export function getMyHandle(callback, signalCallback) {
  callDna('get_my_handle', undefined, signalCallback).then(result => callback(result));
}
//module.exports.getMyHandle = getMyHandle;

export function getHandle(myAgentId, callback, signalCallback) {
  callDna('get_handle', {agentId: myAgentId}, signalCallback).then(result => callback(result));
}
//module.exports.getHandle = getHandle;

export function setHandle(username, callback, signalCallback) {
  callDna('set_handle', username, signalCallback).then(result => callback(result));
}
// module.exports.setHandle = setHandle;

export function getAllHandles(callback, signalCallback) {
  callDna('get_all_handles', undefined, signalCallback).then(result => callback(result));
}
//module.exports.getAllHandles = getAllHandles;

export function findAgent(handle, callback, signalCallback) {
  callDna('find_agent', handle, signalCallback).then(result => callback(result));
}
//module.exports.findAgent = findAgent;

export function pingAgent(agentId, callback, signalCallback) {
  callDna('ping_agent', agentId, signalCallback).then(result => callback(result));
}
//module.exports.pingAgent = pingAgent;

// -- Mail -- //

export function sendMail(mail, callback, signalCallback) {
  callDna('send_mail', {subject: mail.subject, payload: mail.payload, to: mail.to, cc: mail.cc, bcc: mail.bcc, manifest_address_list: mail.manifest_address_list}, signalCallback).then(result => callback(result));
}
//module.exports.sendMail = sendMail;

export function getMail(otherAgentId, callback, signalCallback) {
  callDna('get_mail', otherAgentId, signalCallback).then(result => callback(result));
}
//module.exports.getMail = getMail;

export function deleteMail(mailAddress, callback, signalCallback) {
  callDna('delete_mail', mailAddress, signalCallback).then(result => callback(result));
}
//module.exports.deleteMail = deleteMail;

export function getAllArrivedMail(callback, signalCallback) {
  callDna('get_all_arrived_mail', undefined, signalCallback).then(result => callback(result));
}
//module.exports.getAllArrivedMail = getAllArrivedMail;

export function getAllMails(callback, afterCallback, signalCallback) {
  callDna('get_all_mails', undefined, signalCallback).then(result => {callback(result); afterCallback();});
}
//module.exports.getAllMails = getAllMails;

export function checkIncomingMail(callback, signalCallback) {
  callDna('check_incoming_mail', undefined, signalCallback).then(result => callback(result));
}
//module.exports.checkIncomingMail = checkIncomingMail;

export function checkIncomingAck(callback, signalCallback) {
  callDna('check_incoming_ack', undefined, signalCallback).then(result => callback(result));
}
//module.exports.checkIncomingAck = checkIncomingAck;

export function acknowledgeMail(address, callback, signalCallback) {
  callDna('acknowledge_mail', address, signalCallback).then(result => callback(result));
}
//module.exports.acknowledgeMail = acknowledgeMail;

export function hasMailBeenReceived(address, callback, signalCallback) {
  callDna('has_mail_been_received', address, signalCallback).then(result => callback(result));
}
//module.exports.hasMailBeenReceived = hasMailBeenReceived;

export function hasAckBeenReceived(address, callback, signalCallback) {
  callDna('has_ack_been_received', address, signalCallback).then(result => callback(result));
}
//module.exports.hasAckBeenReceived = hasAckBeenReceived;