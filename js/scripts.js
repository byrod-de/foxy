function storageAvailable(type) {
  let storage;
  try {
    storage = window[type];
    const x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  }
  catch (e) {
    return e instanceof DOMException && (
      // everything except Firefox
      e.code === 22 ||
      // Firefox
      e.code === 1014 ||
      // test name field too, because code might not be present
      // everything except Firefox
      e.name === 'QuotaExceededError' ||
      // Firefox
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
      // acknowledge QuotaExceededError only if there's something already stored
      (storage && storage.length !== 0);
  }
}

function getApiKey() {
  let localStorageApiKey = "";
  if (storageAvailable('localStorage')) {
    localStorageApiKey = localStorage.getItem('api_key');
  }
  let trustedApiKey = document.getElementById("trustedkey").value || localStorageApiKey;

  sessionStorage.trustedApiKey = trustedApiKey;
  localStorage.setItem('api_key', trustedApiKey);

  return trustedApiKey;
}

function getMembersFilters() {
  let localStorageDetailsList = '';
  let defaultDetailsList = '';
  let localStorageStatusList = '';
  let defaultStatusList = '';
  if (storageAvailable('localStorage')) {
    localStorageDetailsList = localStorage.getItem('detailsList');
    localStorageStatusList = localStorage.getItem('statusList');
  }

  let markedCheckboxDetails = document.getElementsByName('details');
  for (let checkbox of markedCheckboxDetails) {
    if (checkbox.checked) defaultDetailsList = defaultDetailsList + checkbox.value + ',';
  }

  let markedCheckboxStatus = document.getElementsByName('status');
  for (let checkbox of markedCheckboxStatus) {
    if (checkbox.checked) defaultStatusList = defaultStatusList + checkbox.value + ',';
  }
  let detailsList = defaultDetailsList || localStorageDetailsList;
  let statusList = defaultStatusList || localStorageStatusList;

  sessionStorage.detailsList = detailsList;
  sessionStorage.statusList = statusList;
  localStorage.setItem('detailsList', detailsList);
  localStorage.setItem('statusList', statusList);

  return detailsList + '#' + statusList;
}

function userSubmit(selection) {
  var trustedApiKey = getApiKey();

  if (trustedApiKey === '') {
    printAlert('Warning', 'You might want to enter your API key if you expect this to work...');
  } else {
    if (selection == 'pa_payouts') {
      callTornAPI(trustedApiKey, 'faction', 'basic,crimes', 'pa_payouts');
    }

    if (selection == 'oc_overview') {
      callTornAPI(trustedApiKey, 'faction', 'basic,crimes', 'oc_overview');
    }

    if (selection == 'reports') {
      callTornAPI(trustedApiKey, 'faction', 'basic,reports', 'reports');
    }

    if (selection == 'members') {
      callTornAPI(trustedApiKey, 'faction', 'basic', 'members');
    }

    if (selection == 'keycheck') {
      callTornAPI(trustedApiKey, 'key', 'info', 'keycheck');
    }

    if (selection == 'news') {
      var category = ''
      if (document.getElementById('armorynews').checked) {
        category = 'armorynews';
      }
      if (document.getElementById('attacknews').checked) {
        category = 'attacknews';
      }
      if (document.getElementById('crimenews').checked) {
        category = 'crimenews';
      }
      if (document.getElementById('fundsnews').checked) {
        category = 'fundsnews';
      }
      if (document.getElementById('mainnews').checked) {
        category = 'mainnews';
      }
      if (document.getElementById('membershipnews').checked) {
        category = 'membershipnews';
      }
      if (document.getElementById('territorynews').checked) {
        category = 'territorynews';
      }

      callTornAPI(trustedApiKey, 'faction', category, 'news');
    }

    if (selection == 'rankedwars') {
      callTornAPI(trustedApiKey, 'torn', 'rankedwars', 'rankedwars');
    }

    document.getElementById('submit').innerHTML = 'Refresh';
  }

}

function callTornStatsAPI(apiKey, id, selection, cacheStats) {
  if (selection == 'user') {
    document.getElementById('statsModalLabel').innerHTML = 'Calling TornStats API';
    document.getElementById('statsModalBody').innerHTML = 'Please hold the line...';

    var request = new XMLHttpRequest();

    request.open('GET', 'https://www.tornstats.com/api/v2/' + apiKey + '/spy/user/' + id, true);

    request.onload = function () {

      var jsonData = JSON.parse(this.response);

      if (request.status >= 200 && request.status < 400) {

        if (jsonData.message.includes("ERROR")) {
          document.getElementById('statsModalLabel').innerHTML = 'Error Occurred';
          document.getElementById('statsModalBody').innerHTML = '<div class="alert alert-warning"><strong>Warning: </strong>Calling TornStats failed.</div>'
            + '<br />Please make sure to use the same API Key as confiured in <a href="https://beta.tornstats.com/settings/general" target="_blank">TornStats</a>.';
        } else {
          if (jsonData.spy.message.includes("Spy not found.")) {
            document.getElementById('statsModalLabel').innerHTML = 'Spy not found';

            let statsModalBody = '';

            statsModalBody = '<div class="alert alert-info"><strong>Warning: </strong>Spy not found on Tornstats.</div>';

            var innerRequest = new XMLHttpRequest();

            innerRequest.open('GET', 'https://api.torn.com/user/' + id + '?selections=personalstats,profile&key=' + apiKey + '&comment=tornengine', true);

            innerRequest.onload = function () {

              var innerJsonData = JSON.parse(this.response);

              if (innerRequest.status >= 200 && innerRequest.status < 400) {

                statsModalBody = statsModalBody + '<div class="text-muted"><strong>Age:</strong> ' + innerJsonData.age.toLocaleString('en-US') + ' days </div>';


                for (var stat in innerJsonData.personalstats) {
                  if (stat === 'xantaken') statsModalBody = statsModalBody + '<div class="text-muted"><strong>Xanax Taken:</strong> ' + innerJsonData.personalstats[stat].toLocaleString('en-US') + '</div>';
                  if (stat === 'statenhancersused') statsModalBody = statsModalBody + '<div class="text-muted"><strong>SE Used:</strong> ' + innerJsonData.personalstats[stat].toLocaleString('en-US') + '</div>';
                  if (stat === 'consumablesused') statsModalBody = statsModalBody + '<div class="text-muted"><strong>Consumables Used:</strong> ' + innerJsonData.personalstats[stat].toLocaleString('en-US') + '</div>';
                  if (stat === 'refills') statsModalBody = statsModalBody + '<div class="text-muted"><strong>Refills:</strong> ' + innerJsonData.personalstats[stat].toLocaleString('en-US') + '</div>';
                }

                statsModalBody = statsModalBody + '<br /><a href="https://www.torn.com/loader.php?sid=attack&user2ID=' + innerJsonData.player_id + '" target="_blank">https://www.torn.com/loader.php?sid=attack&user2ID=' + innerJsonData.player_id + '</a>';
              }
              document.getElementById('statsModalBody').innerHTML = statsModalBody;

            }
            innerRequest.send();

            document.getElementById('statsModalBody').innerHTML = statsModalBody;

          } else {

            var ts = new Date(jsonData.spy.timestamp * 1000);
            let statsModalBody = '';
            let compareList = 'Xanax Taken, Refills';

            document.getElementById('statsModalLabel').innerHTML = '<strong>Player:</strong> ' + jsonData.spy.player_name + ' [' + jsonData.spy.player_id + ']';
            statsModalBody = '<div class="text-muted"><strong>Strength:</strong> ' + jsonData.spy.strength.toLocaleString('en-US') + '</div>'
              + '<div class="text-muted"><strong>Defense:</strong> ' + jsonData.spy.defense.toLocaleString('en-US') + '</div>'
              + '<div class="text-muted"><strong>Speed:</strong> ' + jsonData.spy.speed.toLocaleString('en-US') + '</div>'
              + '<div class="text-muted"><strong>Dexterity:</strong> ' + jsonData.spy.dexterity.toLocaleString('en-US') + '</div>'
              + '<div class="text-primary"><strong>Total:</strong> ' + jsonData.spy.total.toLocaleString('en-US') + '</div>'
              + '<<div class="text-muted"><strong>Update:</strong> ' + ts.toISOString().substring(0, ts.toISOString().indexOf('T')) + '</div>'
              + '<div class="text-muted"><strong>Type:</strong> ' + jsonData.spy.type + '</div>'
              + '<br />';

            for (var key in jsonData.compare.data) {
              if (compareList.includes(key)) statsModalBody = statsModalBody + '<div class="text-muted"><strong>' + key + ':</strong> ' + jsonData.compare.data[key].amount + '</div>'
            }

            statsModalBody = statsModalBody + '<br /><a href="https://www.torn.com/loader.php?sid=attack&user2ID=' + jsonData.spy.player_id + '" target="_blank">https://www.torn.com/loader.php?sid=attack&user2ID=' + jsonData.spy.player_id + '</a>';

            document.getElementById('statsModalBody').innerHTML = statsModalBody;


          }
        }

      } else {
        printAlert('#chedded', 'Torn Stats API is currently not available.');
      }
    }
    request.send();
  }

  if (selection == 'faction') {

    var request = new XMLHttpRequest();

    request.open('GET', 'https://www.tornstats.com/api/v2/' + apiKey + '/spy/faction/' + id, true);

    printAlert('Info', 'Calling <a href="https://beta.tornstats.com/settings/general" target="_blank">TornStats</a>...');

    request.onload = function () {

      var jsonData = JSON.parse(this.response);

      if (request.status >= 200 && request.status < 400) {

        if (jsonData.message.includes("ERROR")) {
          printAlert('Error', 'Please make sure to use the same API Key as confiured in <a href="https://beta.tornstats.com/settings/general" target="_blank">TornStats</a>.');
        } else {
          parseFactionSpies(jsonData['faction'], cacheStats);

          printAlert('Success', 'Stats pulled from <a href="https://beta.tornstats.com/settings/general" target="_blank">TornStats</a>.');
        }
      }



    }
    request.send();


  }

}

function callRankedWarDetails(key, id) {
  document.getElementById('rankedWarModalLabel').innerHTML = 'Calling TornStats API';
  document.getElementById('rankedWarModalBody').innerHTML = 'Please hold the line...';

  var request = new XMLHttpRequest();

  request.open('GET', 'https://api.torn.com/torn/' + id + '?selections=rankedwarreport&key=' + key + '&comment=tornengine', true);

  request.onload = function () {

    var jsonData = JSON.parse(this.response);

    if (request.status >= 200 && request.status < 400) {

      if (jsonData.hasOwnProperty('error')) {
        if (jsonData['error'].code === 7) {
          printAlert('Warning', 'You are trying to access sensible faction data, but are not allowed to. Ask your faction leader for faction API permissions.');
        } else if (jsonData['error'].code === 2) {
          printAlert('Error', 'You are using an incorrect API key.');
        } else {
          printAlert('Error', 'Torn API returned the following error: ' + jsonData['error'].error);
        }
      } else {

        document.getElementById('rankedWarModalLabel').innerHTML = 'Work in progress';
        document.getElementById('rankedWarModalBody').innerHTML = '<div class="alert alert-info"><strong>Info: </strong>Nice try, but this feature is not active yet (-:</div>';



        if (jsonData.hasOwnProperty('rankedwarreport')) {
          printAlert('Success', 'The API Call successful, find the results below.');

          parseRankedWarDetails(jsonData['rankedwarreport'], 'output');
        } else {
          printAlert('Warning', 'Ask your faction leader for faction API permissions.');
        }

      }




    } else {
      printAlert('#chedded', 'Torn Stats API is currently not available.');
    }
  }
  request.send();
}

function callTornAPI(key, part, selection, source) {

  var factionid = '';

  if (source == 'members') factionid = document.getElementById("factionid").value;

  sessionStorage.factionid = factionid;

  var request = new XMLHttpRequest();

  request.open('GET', 'https://api.torn.com/' + part + '/' + factionid + '?selections=' + selection + '&key=' + key + '&comment=tornengine', true);

  request.onload = function () {

    var jsonData = JSON.parse(this.response);

    if (request.status >= 200 && request.status < 400) {

      if (jsonData.hasOwnProperty('error')) {
        if (jsonData['error'].code === 7) {
          printAlert('Warning', 'You are trying to access sensible faction data, but are not allowed to. Ask your faction leader for faction API permissions.');
        } else if (jsonData['error'].code === 2) {
          printAlert('Error', 'You are using an incorrect API key.');
        } else {
          printAlert('Error', 'Torn API returned the following error: ' + jsonData['error'].error);
        }
      } else {

        if (selection === 'basic,crimes' && source === 'pa_payouts') {
          if (jsonData.hasOwnProperty('crimes') && jsonData.hasOwnProperty('members')) {
            printAlert('Success', 'The API Call successful, find the results below.');

            parsePayouts(jsonData['crimes'], 'output', jsonData['members']);
          } else {
            printAlert('Warning', 'Ask your faction leader for faction API permissions.');
          }
        }

        if (selection === 'basic,crimes' && source === 'oc_overview') {
          if (jsonData.hasOwnProperty('crimes') && jsonData.hasOwnProperty('members')) {
            printAlert('Success', 'The API Call successful, find the results below.');

            parseOCs(jsonData['crimes'], 'output', jsonData['members']);
          } else {
            printAlert('Warning', 'Ask your faction leader for faction API permissions.');
          }
        }

        if (selection === 'basic,reports' && source === 'reports') {
          if (jsonData.hasOwnProperty('reports') && jsonData.hasOwnProperty('members')) {
            printAlert('Success', 'The API Call successful, find the results below.');

            parseReports(jsonData['reports'], 'output', jsonData['members']);
          } else {
            printAlert('Warning', 'Ask your faction leader for faction API permissions.');
          }
        }

        if (selection === 'basic,reports' && source === 'reports') {
          if (jsonData.hasOwnProperty('reports')) {
            printAlert('Success', 'The API Call successful, find the results below.');
            parseReports(jsonData['reports'], 'output', jsonData.name);

          }
        }

        if (selection === 'basic,attacks' && source === 'attacks') {
          if (jsonData.hasOwnProperty('attacks')) {
            printAlert('Success', 'The API Call successful, find the results below.');
            parseAttacks(jsonData['attacks'], 'output', jsonData.name);

          }
        }

        if (source === 'news') {
          printAlert('Success', 'The API Call successful, find the results below.');
          parseNews(jsonData[selection], selection, 'output', jsonData.name);
        }

        if (source === 'members') {
          printAlert('Success', 'The API Call successful, find the results below.');
          parseMembers(jsonData, selection, 'output', jsonData['members']);
        }

        if (source === 'keycheck') {
          printAlert('Success', 'The API Call successful, find the results below.');
          parseKeyInfo(jsonData, selection, 'output', jsonData['selections']);
        }

        if (selection === 'rankedwars') {

          if (source === 'rankedwars') {
            printAlert('Success', 'The API Call successful, find the results below.');
            parseRankedWars(jsonData, selection, 'output', jsonData['rankedwars']);
          }
          if (source === 'getWarringFactions') {
            printAlert('Success', 'The API Call successful, faction list preloaded.');
            getWarringFactions(jsonData, selection, 'output', jsonData['rankedwars']);
          }
        }
      }

    } else {
      printAlert('#chedded', 'Torn API is currently not available.');
    }
  }
  request.send();
}

function parseKeyInfo(keyInfoData, selection, element, keyInfo) {
  var trustedApiKey = document.getElementById("trustedkey").value;

  var accessLevelInformation = keyInfoData.access_level + ': ' + keyInfoData.access_type;
  var accessClass = '';

  switch (keyInfoData.access_level) {
    case 1: accessClass = 'badge-light'; break;
    case 2: accessClass = 'badge-success'; break;
    case 3: accessClass = 'badge-warning'; break;
    case 4: accessClass = 'badge-danger'; break;
    case 0: accessClass = 'badge-info'; break;
  }

  var table = '<div class="col-sm-12 ' + accessClass + '" >Your key has the following access level - '
    + accessLevelInformation
    + '</div>';


  table = table + '<br /><table class="table table-hover" id="selections"><thead><tr>'
    + '<th>Selection</th>'
    + '<th>Element</th>'
    + '<th>Access Level</th>';

  table = table + '</tr></thead><tbody>';

  var accessLevel = '';
  var tableClass = '';

  for (var selectionsEntry in keyInfo) {
    var selectionData = keyInfo[selectionsEntry];

    for (var selectionName in selectionData) {

      switch (selectionsEntry) {
        case 'torn': tableClass = 'table-dark'; accessLevel = 'Public';
          break;
        case 'market': tableClass = 'table-dark'; accessLevel = 'Public';
          break;
        case 'properties': tableClass = 'table-success'; accessLevel = 'Minimal Access';
          break;
        case 'property': tableClass = 'table-dark'; accessLevel = 'Public';
          break;
        case 'key': tableClass = 'table-dark'; accessLevel = 'Public';
          break;
        case 'company': switch (selectionData[selectionName]) {
          case 'profile': tableClass = 'table-dark'; accessLevel = 'Public';
            break;
          case 'timestamp': tableClass = 'table-dark'; accessLevel = 'Public';
            break;
          case 'lookup': tableClass = 'table-dark'; accessLevel = 'Public';
            break;
          default: tableClass = 'table-warning'; accessLevel = 'Limited Access';

        }
          break;
        case 'faction': switch (selectionData[selectionName]) {
          case 'attacknews': tableClass = 'table-warning'; accessLevel = 'Limited Access';
            break;
          case 'attacks': tableClass = 'table-warning'; accessLevel = 'Limited Access';
            break;
          case 'attacksfull': tableClass = 'table-warning'; accessLevel = 'Limited Access';
            break;
          case 'basic': tableClass = 'table-dark'; accessLevel = 'Public';
            break;
          case 'cesium': tableClass = 'table-warning'; accessLevel = 'Limited Access';
            break;
          case 'chain': tableClass = 'table-warning'; accessLevel = 'Limited Access';
            break;
          case 'contributors': tableClass = 'table-warning'; accessLevel = 'Limited Access';
            break;
          case 'currency': tableClass = 'table-warning'; accessLevel = 'Limited Access';
            break;
          case 'donations': tableClass = 'table-warning'; accessLevel = 'Limited Access';
            break;
          case 'reports': tableClass = 'table-warning'; accessLevel = 'Limited Access';
            break;
          case 'fundsnews': tableClass = 'table-warning'; accessLevel = 'Limited Access';
            break;
          case 'timestamp': tableClass = 'table-dark'; accessLevel = 'Public';
            break;
          case 'lookup': tableClass = 'table-dark'; accessLevel = 'Public';
            break;
          default: tableClass = 'table-success'; accessLevel = 'Minimal Access';

        }
          break;
        case 'user': switch (selectionData[selectionName]) {
          case 'attacks': tableClass = 'table-warning'; accessLevel = 'Limited Access';
            break;
          case 'attacksfull': tableClass = 'table-warning'; accessLevel = 'Limited Access';
            break;
          case 'basic': tableClass = 'table-dark'; accessLevel = 'Public';
            break;
          case 'battlestats': tableClass = 'table-warning'; accessLevel = 'Limited Access';
            break;
          case 'bazaar': tableClass = 'table-dark'; accessLevel = 'Public';
            break;
          case 'crimes': tableClass = 'table-dark'; accessLevel = 'Public';
            break;
          case 'discord': tableClass = 'table-dark'; accessLevel = 'Public';
            break;
          case 'display': tableClass = 'table-dark'; accessLevel = 'Public';
            break;
          case 'events': tableClass = 'table-warning'; accessLevel = 'Limited Access';
            break;
          case 'hof': tableClass = 'table-warning'; accessLevel = 'Limited Access';
            break;
          case 'log': tableClass = 'table-danger'; accessLevel = 'Full Access';
            break;
          case 'messages': tableClass = 'table-warning'; accessLevel = 'Limited Access';
            break;
          case 'money': tableClass = 'table-warning'; accessLevel = 'Limited Access';
            break;
          case 'networth': tableClass = 'table-warning'; accessLevel = 'Limited Access';
            break;
          case 'personalstats': tableClass = 'table-dark'; accessLevel = 'Public';
            break;
          case 'profile': tableClass = 'table-dark'; accessLevel = 'Public';
            break;
          case 'receivedevents': tableClass = 'table-warning'; accessLevel = 'Limited Access';
            break;
          case 'reports': tableClass = 'table-warning'; accessLevel = 'Limited Access';
            break;
          case 'stocks': tableClass = 'table-warning'; accessLevel = 'Limited Access';
            break;
          case 'timestamp': tableClass = 'table-dark'; accessLevel = 'Public';
            break;
          case 'lookup': tableClass = 'table-dark'; accessLevel = 'Public';
            break;
          default: tableClass = 'table-success'; accessLevel = 'Minimal Access';
        }
          break;
        default: tableClass = ''; accessLevel = '';

      }

      table = table + '<tr class="' + tableClass + '">'
        + '<td>' + selectionsEntry + '</td>'
        + '<td>' + selectionData[selectionName] + '</td>'
        + '<td>' + accessLevel + '</td>'
        + '</tr>';
    }
    //}
  }

  table = table + '</tbody></table>';

  $(document).ready(function () {
    $('#selections').DataTable({
      "paging": false,
      "order": [[0, "asc"], [1, "asc"]],
      "info": false,
      "stateSave": true
    });
  });

  document.getElementById(element).innerHTML = table;
}


function parseFactionSpies(faction, cacheStats) {
  var membersList = faction['members'];


  for (var id in faction['members']) {

    if (membersList[id].status.description != 'Fallen') {
      if ('spy' in membersList[id]) {

        var ts = new Date(membersList[id].spy.timestamp * 1000);


        var stats = '&nbsp;Dex:&nbsp;' + abbreviateNumber(membersList[id].spy.dexterity).toLocaleString('en-US')
          + ',&nbsp;Def:&nbsp;' + abbreviateNumber(membersList[id].spy.defense).toLocaleString('en-US')
          + ',&nbsp;Str:&nbsp;' + abbreviateNumber(membersList[id].spy.strength).toLocaleString('en-US')
          + ',&nbsp;Spd:&nbsp;' + abbreviateNumber(membersList[id].spy.speed).toLocaleString('en-US');


        document.getElementById('stats_' + id).innerHTML =
          abbreviateNumber(membersList[id].spy.total).toLocaleString('en-US')
          + '&nbsp;<span class="text-muted">' + stats + '</div>'
          + '<div class="text-secondary">' + ts.toISOString().substring(0, ts.toISOString().indexOf('T')) + '</div>'
          ;

        if (cacheStats) {

          indexedDBRequest = openIndexedDB('TornEngine_pst', 1);

          initializeIndexedDB(indexedDBRequest, 'Stats');

          insertPlayer(indexedDBRequest, 'Stats', {
            playerID: id,
            defense: membersList[id].spy.defense,
            speed: membersList[id].spy.speed,
            dexterity: membersList[id].spy.dexterity,
            strength: membersList[id].spy.strength,
            total: membersList[id].spy.total,
            timestamp: membersList[id].spy.timestamp
          });
        }
      }
    }
  }
}


function parseMembers(statusData, selection, element, membersList) {

  var trustedApiKey = document.getElementById("trustedkey").value;

  var statusList = '';
  var markedCheckboxStatus = document.getElementsByName('status');
  for (var checkbox of markedCheckboxStatus) {
    if (checkbox.checked) statusList = statusList + checkbox.value + ',';
  }

  var detailsList = '';
  var markedCheckboxDetails = document.getElementsByName('details');
  for (var checkbox of markedCheckboxDetails) {
    if (checkbox.checked) detailsList = detailsList + checkbox.value + ',';
  }

  var filterMinutesHosp = false;
  if (document.getElementById('MinutesHosp').checked) {
    filterMinutesHosp = true;
  }

  var filterMinutesAction = 0;
  if (document.getElementById('FilterActive').checked) {
    filterMinutesAction = document.getElementById('TimeActive').value;
  }

  var integrateFactionStats = false;
  if (document.getElementById('FactionStats').checked) {
    integrateFactionStats = document.getElementById('FactionStats').checked;
  }

  var cacheStats = false;
  if (integrateFactionStats) {
    cacheStats = checkIndexedDBSupport();
  }


  var printEntry = false;

  var table = '<div class="col-sm-12 badge-primary" ><b>Members Status of <img src="https://factiontags.torn.com/'
    + statusData.tag_image + '"> '
    + statusData.name
    + ' [' + statusData.ID + ']'
    + '</b>&nbsp;&nbsp;<input type="button" class="btn btn-outline-light btn-sm" value="select table content" onclick="selectElementContents( document.getElementById(\'members\') );">';
  table = table + '</div><br />';

  if (integrateFactionStats) table = table + '<div class="float-right"><button type="button" onclick="callTornStatsAPI(\'' + trustedApiKey + '\', ' + statusData.ID + ', \'faction\', ' + cacheStats + ')" class="btn btn-primary btn-sm">Get Faction Stats</button></div>';



  table = table + '<br /><table class="table table-hover" id="members"><thead><tr>'
    + '<th>Name&nbsp;&nbsp;</th>'
    + '<th>Icons&nbsp;&nbsp;</th>'
    + '<th>Attack Link&nbsp;&nbsp;</th>'
    + '<th>Status&nbsp;&nbsp;</th>'
    + '<th>Details&nbsp;&nbsp;</th>'
    + '<th>Description&nbsp;&nbsp;</th>'
    + '<th>Last Action&nbsp;&nbsp;</th>'
    + '<th>Level&nbsp;&nbsp;</th>';
  if (integrateFactionStats) table = table + '<th>Torn Stats&nbsp;&nbsp;</th>';
  table = table + '<th>Stats Popup&nbsp;&nbsp;</th>'

  table = table + '</tr></thead><tbody>';

  var statusFormat = '';
  var detailFormat = '';
  var countMembers = 0;
  var filteredMembers = 0;
  var statusDescriptionText = '';


  var timeStamp = Math.floor(Date.now() / 1000);
  var timeDifference = 0;

  for (var id in membersList) {

    printEntry = false;
    statusDescriptionText = '';

    var member = membersList[id];
    var memberStatusState = member.status.state;
    var hospitalTime = '';

    if ((filterMinutesHosp && memberStatusState == 'Hospital')
      || (!filterMinutesHosp && memberStatusState == 'Hospital')
      || (member.status.state !== 'Hospital')) {

      if (filterMinutesHosp && memberStatusState == 'Hospital') {
        timeDifference = (member.status.until - timeStamp) / 60;
        if (timeDifference < 15) {
          printEntry = true;
        }
      } else {
        printEntry = true;
      }
    }

    if (memberStatusState == 'Hospital') {
      timeDifference = (member.status.until - timeStamp);

      dateObj = new Date(timeDifference * 1000);
      hours = dateObj.getUTCHours();
      minutes = dateObj.getUTCMinutes();
      seconds = dateObj.getSeconds();

      //timeString = hours.toString().padStart(2, '0') + ' hrs ' +
      //    minutes.toString().padStart(2, '0') + ' min ' +
      //    seconds.toString().padStart(2, '0') + ' sec';
      if (hours.toString() == 0) {
        hours = hours.toString().padStart(2, '0') + ' hrs ';
      } else {
        hours = hours.toString().padStart(2, '0') + ' hrs ';
      }

      if (minutes.toString() == 0) {
        minutes = minutes.toString().padStart(2, '0') + ' min ';
      } else {
        minutes = minutes.toString().padStart(2, '0') + ' min ';
      }

      if (seconds.toString() == 0) {
        seconds = seconds.toString().padStart(2, '0') + ' sec ';
      } else {
        seconds = seconds.toString().padStart(2, '0') + ' sec ';
      }
      timeString = hours + minutes + seconds;


      statusDescriptionText = 'In hospital for ' + timeString;
      hospitalTime = ' out in ' + timeString;


    } else {
      statusDescriptionText = member.status.description.replace('to Torn ', '');
    }

    var memberLastActionTimestamp = (timeStamp - member.last_action.timestamp);
    var memberLastAction = '';

    if (filterMinutesAction > memberLastActionTimestamp / 60) {
      printEntry = false;
    }


    dateObj = new Date(memberLastActionTimestamp * 1000);
    hours = dateObj.getUTCHours();
    minutes = dateObj.getUTCMinutes();
    seconds = dateObj.getSeconds();

    if (member.last_action.relative.includes('day')) {
      memberLastAction = 'Days ago: ' + member.last_action.relative.split(" ")[0];
    } else {
      if (hours.toString() == 0) {
        hours = '<span class="text-secondary">' + hours.toString().padStart(2, '0') + ' hrs </span>';
      } else {
        hours = hours.toString().padStart(2, '0') + ' hrs ';
      }

      if (minutes.toString() == 0) {
        minutes = '<span class="text-secondary">' + minutes.toString().padStart(2, '0') + ' min </span>';
      } else {
        minutes = minutes.toString().padStart(2, '0') + ' min ';
      }

      if (seconds.toString() == 0) {
        seconds = '<span class="text-secondary">' + seconds.toString().padStart(2, '0') + ' sec </span>';
      } else {
        seconds = seconds.toString().padStart(2, '0') + ' sec ';
      }
      memberLastAction = hours + minutes + seconds;
    }

    var icon = '';
    var detail = '';
    if (member.last_action.status == 'Online') statusFormat = 'badge-success';
    if (member.last_action.status == 'Idle') statusFormat = 'badge-warning';
    if (member.last_action.status == 'Offline') statusFormat = 'badge-dark';

    if (memberStatusState == 'Hospital') {
      detailFormat = 'badge-danger';
      icon = icon + '<img src="images/icon_hosp.png" alt="Hospital" title="Hospital" width="20" height="20"/>&nbsp;';
      detail = '<span class="badge badge-pill ' + detailFormat + '">' + memberStatusState + '</span>';
      if (member.status.description.includes('In a')) {
        memberStatusState = 'Abroad';
      }
    }
    if (memberStatusState == 'Okay') {
      detailFormat = 'badge-success';
      detail = '<span class="badge badge-pill ' + detailFormat + '">' + memberStatusState + '</span>';
    }
    if (memberStatusState == 'Jail') {
      detailFormat = 'badge-warning';
      icon = icon + '<img src="images/icon_jail.png" alt="Jail" title="Jail" width="20" height="20"/>&nbsp;';
      detail = '<span class="badge badge-pill ' + detailFormat + '">' + memberStatusState + '</span>';
    }
    if (memberStatusState == 'Traveling') {
      detailFormat = 'badge-dark';
      icon = icon + '<img src="images/icon_travel.png" alt="Traveling" title="Traveling" width="20" height="20"/>&nbsp;';
      detail = '<span class="badge badge-pill ' + detailFormat + '">' + memberStatusState + '</span>';
    }
    if (memberStatusState == 'Abroad') {
      detailFormat = 'badge-info';
      icon = icon + '<img src="images/icon_abroad.png" alt="Abroad" title="Abroad" width="20" height="20"/>&nbsp;';
      detail = detail + '<span class="badge badge-pill ' + detailFormat + '">' + memberStatusState + '</span>';
    }

    if (statusList.includes(member.last_action.status)
      && detailsList.includes(memberStatusState)
      && printEntry) {

      var copyableText = ' >> ' + member.name + ' << ' + hospitalTime.replace(' hrs ', ':').replace(' min ', ':').replace(' sec ', '') + ' || https://www.torn.com/loader.php?sid=attack&user2ID=' + id;

      table = table + '<tr>'

        + '<td class="align-middle"><a href="https://www.torn.com/profiles.php?XID=' + id + '" target="_blank">' + member.name + ' [' + id + ']</a></td>'
        + '<td class="align-middle">' + icon + '</td>'
        + '<td class="align-middle">'
        + '<a class="btn btn-link btn-sm" role="button" href="https://www.torn.com/loader.php?sid=attack&user2ID=' + id + '" target="_blank">Attack Link</a>&nbsp;'
        + '<input type="hidden" class="form-control" value="' + copyableText + '" placeholder="..." id="copy-input-' + id + '">'
        + '<button type="button" onclick="copyButton(' + id + ')" class="btn btn-secondary btn-sm" id="copy-button' + id + '" data-toggle="tooltip" data-placement="button" title="Copy for Faction Chat">'
        + 'Copy</button>'
        + '</td>'
        + '<td class="align-middle">' + '<span class="badge badge-pill ' + statusFormat + '">' + member.last_action.status + '</span>' + '</td>'
        + '<td class="align-middle">' + detail + '</td>'
        + '<td class="align-middle">' + statusDescriptionText + '</td>'
        + '<td class="align-middle">' + memberLastAction + '</td>'
        + '<td class="align-middle">' + member.level + '</td>'


      if (integrateFactionStats) {
        var stat = '';
        if (cacheStats) {
          indexedDBRequest = openIndexedDB('TornEngine_pst', 1);

          initializeIndexedDB(indexedDBRequest, 'Stats');
          stat = getPlayerById(indexedDBRequest, 'Stats', id);
        }
        table = table + '<td class="align-middle" id="stats_' + id + '" >' + stat + '</td>';
      }

      table = table + '<td class="align-middle">'
        + '<button type="button" onclick="callTornStatsAPI(\'' + trustedApiKey + '\', ' + id + ', \'user\', false)" class="btn btn-secondary btn-sm" data-toggle="modal" data-target="#statsModal">Show Stats</button>'
        + '</td>'

      filteredMembers++;
    }

    table = table + '</tr>';
    countMembers++;
  }
  table = table + '</tbody></table>';

  $(document).ready(function () {
    $('#members').DataTable({
      "paging": false,
      "order": [[5, "asc"]],
      "info": false,
      "stateSave": true
    });
  });

  document.getElementById(element).innerHTML = table;

  var ts = new Date(timeStamp * 1000);
  var formatted_date = ts.toISOString().replace('T', ' ').replace('.000Z', '');

  document.getElementById('summary').innerHTML = `<span class="text-primary">${filteredMembers} members out of ${countMembers} total members filtered.</span> <span class="text-muted">Last refreshed: ${formatted_date}</span>`;

}

function parseNews(newsData, selection, element, membersList) {

  document.getElementById('summary').innerHTML = `You are looking for ${selection}.`;

  var table = '<div class="col-sm-12 badge-primary" ><b> ' + selection + '</b></div>';
  table = table + '<br /><table class="table table-hover" id="news"><thead><tr>'
    + '<th>Date</th>'
    + '<th>News</th>';

  table = table + '</tr></thead><tbody>';

  for (var id in newsData) {

    var news = newsData[id];
    var ts = new Date(news.timestamp * 1000);
    var formatted_date = ts.toISOString().replace('T', ' ').replace('.000Z', '');

    table = table + '<tr>'
      + '<td>' + formatted_date + '</td>'
      + '<td>' + news.news + '</td>';

    table = table + '</tr>';

  }
  table = table + '</tbody></table>';

  $(document).ready(function () {
    $('#news').DataTable({
      "paging": false,
      "order": [[0, "desc"]],
      "info": false,
      "stateSave": true
    });
  });
  document.getElementById(element).innerHTML = table;

}

function getWarringFactions(rankedWarData, selection, element, rankedWars) {

  var datalist = '';

  for (var id in rankedWars) {

    var rankedWar = rankedWars[id];

    for (var factionID in rankedWar.factions) {

      var faction = rankedWar.factions[factionID];

      if (!datalist.includes(faction.name)) {
        datalist = datalist + '<option value="' + factionID + '">' + faction.name + '</option>';
      }


    }
  }

  document.getElementById("hint2").innerHTML = 'Factions in a ranked war can be searched for.';
  document.getElementById("factions").innerHTML = datalist;


}

function parseRankedWars(rankedWarData, selection, element, rankedWars) {

  checkAPIKey();

  var trustedApiKey = document.getElementById("trustedkey").value;

  var warStatusList = '';

  var markedCheckbox = document.getElementsByName('warStatus');
  for (var checkbox of markedCheckbox) {
    if (checkbox.checked)
      warStatusList = warStatusList + checkbox.value + ',';
  }



  var table = '<div class="col-sm-12 badge-primary" ><b> Ranked War Details </b></div>';
  table = table + '<br /><table class="table table-hover text-center" id="wars"><thead><tr>'
    + '<th class="align-middle">Start Time</th>'
    // + '<th>Duration</th>'
    + '<th class="align-middle">Status<br />Progress</th>'
    + '<th class="align-middle">Target</th>'
    // + '<th>Progress</th>'
    + '<th class="align-middle">Lead</th>'
    + '<th class="align-middle">Faction 1<br />(Member Status)</th>'
    + '<th class="align-middle">Score #1</th>'
    + '<th class="align-middle">Score #2</th>'
    + '<th class="align-middle">Faction 2<br />(Member Status)</th>'
    + '<th class="align-middle">Details</th>'

    ;

  table = table + '</tr></thead><tbody>';

  for (var id in rankedWars) {

    var rankedWar = rankedWars[id];
    var ts = new Date(rankedWar.war.start * 1000);
    var formatted_date = ts.toISOString().replace('T', ' ').replace('.000Z', '');
    var faction1Name = '', faction2Name = '';
    var faction1ID = '', faction2ID = '';
    var faction1Score = '', faction2Score = '';
    var faction1StyleClass = '', faction2StyleClass = '';
    var counter = 0;
    var warStatus = '', warStatusStyleClass = '', duration = 0, durationString = '', progressBarStyleClass, detailsButton = '';
    var currentTimeStamp = Math.floor(Date.now() / 1000);

    if (rankedWar.war.end == 0) {
      if (currentTimeStamp < rankedWar.war.start) {
        warStatusStyleClass = '<span class="badge badge-pill badge-info">Scheduled</span>';
        warStatus = 'scheduled';
        progressBarStyleClass = 'class="progress-bar progress-bar-striped progress-bar-animated bg-info"';
      } else {
        warStatusStyleClass = '<span class="badge badge-pill badge-primary">Ongoing</span>';
        warStatus = 'ongoing';
        progressBarStyleClass = 'class="progress-bar progress-bar-striped progress-bar-animated bg-primary"';
        duration = currentTimeStamp - rankedWar.war.start;
      }
    } else {
      warStatusStyleClass = '<span class="badge badge-pill badge-success">Ended</span>';
      warStatus = 'ended';
      progressBarStyleClass = 'class="progress-bar bg-success"';
      detailsButton = '<button type="button" onclick="callRankedWarDetails(\'' + trustedApiKey + '\', ' + id + ')" class="btn btn-secondary" data-toggle="modal" data-target="#rankedWarModal">Show Details</button>';
      duration = rankedWar.war.end - rankedWar.war.start;
    }

    dateObj = new Date(duration * 1000);

    hours = dateObj.getUTCHours();
    minutes = dateObj.getUTCMinutes();
    seconds = dateObj.getSeconds();

    durationString = hours.toString().padStart(2, '0') + ':' +
      minutes.toString().padStart(2, '0') + ':' +
      seconds.toString().padStart(2, '0');

    if (warStatusList.includes(warStatus)) {

      for (var factionID in rankedWar.factions) {

        var faction = rankedWar.factions[factionID];

        if (counter == 0) {
          faction1Name = faction.name;
          faction1Score = faction.score;
          faction1ID = factionID;
          counter = 1;
        } else {
          faction2Name = faction.name;
          faction2Score = faction.score;
          faction2ID = factionID;
        }
      }


      if ((faction1ID === rankedWar.war.winner) || (faction1Score > faction2Score)) {
        faction1StyleClass = ' class="text-success"';
        faction2StyleClass = ' class="text-danger"';
      }
      if ((faction2ID === rankedWar.war.winner) || (faction1Score < faction2Score)) {
        faction1StyleClass = ' class="text-danger"';
        faction2StyleClass = ' class="text-success"';
      }

      var percentage = Math.abs(faction1Score - faction2Score) / rankedWar.war.target * 100;

      table = table + '<tr>'
        + '<td class="align-middle">' + formatted_date + '</td>'
        + '<td class="align-middle">' + warStatusStyleClass + ''
        + '<br /><div class="progress"><div ' + progressBarStyleClass + ' role="progressbar" aria-valuenow="' + percentage + '" aria-valuemin="0" aria-valuemax="100" style="width: ' + percentage + '%;"></div></div></td>'

        + '<td class="align-middle">' + rankedWar.war.target + '</td>'
        + '<td class="align-middle">' + Math.abs(faction1Score - faction2Score) + '</td>'
        + '<td class="align-middle"><a href="https://www.torn.com/factions.php?step=profile&ID=' + faction1ID + '" target="_blank" ' + faction1StyleClass + '>' + faction1Name + '</a>'
        + '<br /><a href="members.html?factionID=' + faction1ID + '"><button type="button" class="btn btn-secondary btn-sm">Show Members</button></a></td>'
        + '<td class="align-middle">' + faction1Score + '</td>'
        + '<td class="align-middle">' + faction2Score + '</td>'
        + '<td class="align-middle"><a href="https://www.torn.com/factions.php?step=profile&ID=' + faction2ID + '" target="_blank" ' + faction2StyleClass + '>' + faction2Name + '</a>'
        + '<br /><a href="members.html?factionID=' + faction2ID + '"><button type="button" class="btn btn-secondary btn-sm">Show Members</button></a></td>'
        + '<td class="align-middle">' + detailsButton + '</td>'

        ;

      table = table + '</tr>';

    }
  }
  table = table + '</tbody></table>';

  $(document).ready(function () {
    $('#wars').DataTable({
      "paging": false,
      "order": [[0, "desc"]],
      "info": false,
      "stateSave": true
    });
  });

  document.getElementById(element).innerHTML = table;



}

function parseRankedWarDetails(rankedWarDetails, element) {

  var counter = 0;
  var faction1ID, faction1Name, faction1Score;
  var faction2ID, faction2Name, faction2Score;
  var faction1StyleClass, faction2StyleClass;


  for (var id in rankedWarDetails.factions) {

    if (counter == 0) {
      faction1ID = id;
      faction1Name = rankedWarDetails.factions[id].name;
      faction1Score = rankedWarDetails.factions[id].score;
      counter = 1;
    } else {
      faction2ID = id;
      faction2Name = rankedWarDetails.factions[id].name;
      faction2Score = rankedWarDetails.factions[id].score;
      counter = 2;
    }

  }


  if (faction1Score > faction2Score) {
    faction1StyleClass = ' class="text-success"';
    faction2StyleClass = ' class="text-danger"';
  }
  if (faction1Score < faction2Score) {
    faction1StyleClass = ' class="text-danger"';
    faction2StyleClass = ' class="text-success"';
  }

  var table = '';
  table = table + '<br /><table class="table table-hover text-center" id="warfactions"><thead>'
    + '<tr>'
    + '<th class="align-middle" colspan="2"><a href="https://www.torn.com/factions.php?step=profile&ID=' + faction1ID + '" target="_blank" ' + faction1StyleClass + '>' + faction1Name + '</a></th>'
    + '<th class="align-middle">' + faction1Score + '</th>'
    + '<th class="align-middle">' + faction2Score + '</th>'
    + '<th class="align-middle" colspan="2"><a href="https://www.torn.com/factions.php?step=profile&ID=' + faction2ID + '" target="_blank" ' + faction2StyleClass + '>' + faction2Name + '</a></th>'
    + '</tr>'
    ;

  table = table + '</thead><tbody>';
  table = table + '</tbody></table><br/>';

  table = table + '<br /><table class="table table-hover text-center" id="wardetails"><thead>'
    + '<tr>'
    + '<th class="align-middle">Name</th>'
    + '<th class="align-middle">Faction</th>'
    + '<th class="align-middle">Hits</th>'
    + '<th class="align-middle">Score</th>'
    + '</tr>'
    ;

  table = table + '</thead><tbody>';

  var factionName, factionStyleClass;

  for (var id in rankedWarDetails.members) {

    if (rankedWarDetails.members[id].faction_id == faction1ID) {
      factionName = faction1Name;
      factionStyleClass = faction1StyleClass;
    }

    if (rankedWarDetails.members[id].faction_id == faction2ID) {
      factionName = faction2Name;
      factionStyleClass = faction2StyleClass;
    }

    table = table + '<tr>'
      + '<td class="align-middle"><a href="https://www.torn.com/profiles.php?XID=' + id + '" target="_blank">' + rankedWarDetails.members[id].name + ' [' + id + ']</a></td>'
      + '<td class="align-middle"><a href="https://www.torn.com/factions.php?step=profile&ID=' + rankedWarDetails.members[id].faction_id + '" target="_blank" ' + factionStyleClass + '>' + factionName + '</a></td>'
      + '<td class="align-middle">' + rankedWarDetails.members[id].attacks + '</td>'
      + '<td class="align-middle">' + rankedWarDetails.members[id].score + '</td>'
      + '</tr>';


  }



  table = table + '</tbody></table>';

  $(document).ready(function () {
    $('#wardetails').DataTable({
      "paging": false,
      "order": [[3, "desc"]],
      "info": false,
      "stateSave": true
    });
  });

  document.getElementById('rankedWarModalLabel').innerHTML = 'War Details';
  document.getElementById('rankedWarModalBody').innerHTML = table;

}

function parseReports(reportData, element, membersList) {

  var type = '';
  var header = '';

  if (document.getElementById('money').checked) {
    type = 'money';
    header = 'Money Reports'
  }
  if (document.getElementById('stats').checked) {
    type = 'stats';
    header = 'Stat Spies'
  }
  if (document.getElementById('friendorfoe').checked) {
    type = 'friendorfoe';
    header = 'Friend or Foe Reports'
  }

  document.getElementById('summary').innerHTML = 'You are looking for ' + header + '.';

  var table = '<div class="col-sm-12 badge-primary" ><b> ' + header + '</b></div>';
  table = table + '<table class="table table-hover"><thead><tr>'
    + '<th>Date</th>'
    + '<th>Member</th>'
    + '<th>Type</th>'
    + '<th>Target</th>';

  if (type === 'money') {
    table = table + '<th>Money</th>';
  }

  if (type === 'stats') {
    table = table + '<th>Total</th>';
    table = table + '<th>Str</th>';
    table = table + '<th>Def</th>';
    table = table + '<th>Spd</th>';
    table = table + '<th>Dex</th>';

  }

  table = table + '</tr></thead><tbody>';


  for (var id in reportData) {
    var report = reportData[id];
    if (report.type === type) {

      var ts = new Date(report.timestamp * 1000);
      var formatted_date = ts.toISOString().replace('T', ' ').replace('.000Z', '');

      table = table + '<tr>'
        + '<td>' + formatted_date + '</td>'
        + '<td><a href="https://www.torn.com/profiles.php?XID=' + report.user_id + '" target="_blank">' + membersList[report.user_id].name + '</a></td>'
        + '<td>' + header + '</td>'
        + '<td><a href="https://www.torn.com/profiles.php?XID=' + report.target + '" target="_blank">' + report.target + '</a></td>';

      if (type === 'money') {
        table = table + '<td>$' + report.report.money.toLocaleString('en-US') + '</td>'
      }

      if (type === 'stats') {
        if (report.report.hasOwnProperty('total_battlestats')) {
          table = table + '<td>' + report.report.total_battlestats.toLocaleString('en-US') + '</td>';
        } else {
          table = table + '<td>N/A</td>';
        }

        if (report.hasOwnProperty('strength')) {
          table = table + '<td>' + report.report.strength.toLocaleString('en-US') + '</td>';
        } else {
          table = table + '<td>N/A</td>';
        }

        if (report.hasOwnProperty('defense')) {
          table = table + '<td>' + report.report.defense.toLocaleString('en-US') + '</td>';
        } else {
          table = table + '<td>N/A</td>';
        }

        if (report.hasOwnProperty('speed')) {
          table = table + '<td>' + report.report.speed.toLocaleString('en-US') + '</td>';
        } else {
          table = table + '<td>N/A</td>';
        }

        if (report.hasOwnProperty('dexterity')) {
          table = table + '<td>' + report.report.dexterity.toLocaleString('en-US') + '</td>';
        } else {
          table = table + '<td>N/A</td>';
        }
      }


      table = table + '</tr>';
    }
  }
  table = table + '</tbody></table>';
  document.getElementById(element).innerHTML = table;

}

function parsePayouts(crimeData, element, membersList) {

  var memberMoney = {};
  var memberSuccess = {};
  var memberFailed = {};
  var factionMoney = 0;
  var factionSuccess = 0;
  var factionFailed = 0;
  var totalRespect = 0;
  var totalMoney = 0;
  var today = new Date();
  var badgeSuccess = 'badge-dark';
  var badgeFailed = 'badge-dark';

  if (document.getElementById('current').checked) {
    var currentMonth = today.getMonth() + 1;
    if (currentMonth > 11) { currentMonth = 0; }
  }
  if (document.getElementById('last').checked) {
    var currentMonth = today.getMonth();
    if (currentMonth == 0) { currentMonth = 12; }
  }
  if (document.getElementById('before').checked) {
    var currentMonth = today.getMonth() - 1;
    if (currentMonth == 0) { currentMonth = 12; }
    if (currentMonth < 0) { currentMonth = 11; }
  }

  var split = document.getElementById('range').value;
  var weighted = document.getElementById('weighted').checked;
  var paLeads = '';


  var table = '<div class="col-sm-12 badge-primary" ><b>PA Details for ' + monthToText(currentMonth) + '</b> <input type="button" class="btn btn-outline-light btn-sm" value="select table content" onclick="selectElementContents( document.getElementById(\'totals\') );"></div>';
  table = table + '<br />';
  table = table + '<table class="table table-hover" id="totals"><thead><tr>'
    + '<th>Date</th>'
    + '<th>Participants</th>'
    + '<th>Crime Type</th>'
    + '<th>Result</th>'
    + '<th>Money Gained<br/>'
    + '<th>Respect Gained</th>'
    + '</tr></thead><tbody>';

  for (var id in crimeData) {
    var crime = crimeData[id];
    // 8 = PA
    if (crime.crime_id === 8) {
      var ts = new Date(crime.time_completed * 1000);

      if (crime.initiated === 1 && ts.getMonth() + 1 === currentMonth) {

        var crimeResult = '';
        var failed = 0;
        var success = 0;
        var participants = '';
        var tmp = '';
        var countRank = 0;
        var prefix = '';

        if (crime.success === 0) {
          crimeResult = '<span class="badge badge-pill badge-danger">Failed</span>';
          failed = 1;
        } else {
          crimeResult = '<span class="badge badge-pill badge-success">Success</span>';
          success = 1;
        }

        crime.participants.forEach(obj => {
          Object.entries(obj).forEach(([key, value]) => {
            var memberID = `${key}`;
            countRank = countRank + 1;
            if (weighted) {
              prefix = countRank + '| ';
            }

            var memberName = '';
            if (membersList.hasOwnProperty(memberID)) {
              memberName = prefix + membersList[memberID].name;
              if (weighted && prefix === '1| ') {
                if (!paLeads.includes(memberName))
                  paLeads = memberName + ';' + paLeads;
              }
              if (memberName in memberMoney) {
                memberMoney[memberName] = memberMoney[memberName] + (crime.money_gain / split);
                memberSuccess[memberName] = memberSuccess[memberName] + success;
                memberFailed[memberName] = memberFailed[memberName] + failed;
              } else {
                memberMoney[memberName] = (crime.money_gain / split);
                memberSuccess[memberName] = success;
                memberFailed[memberName] = failed;
              }
            } else {
              memberName = memberID;

              if (memberName in memberMoney) {
                memberMoney[memberName] = memberMoney[memberName] + (crime.money_gain / split);
                memberSuccess[memberName] = memberSuccess[memberName] + success;
                memberFailed[memberName] = memberFailed[memberName] + failed;
              } else {
                memberMoney[memberName] = (crime.money_gain / split);
                memberSuccess[memberName] = success;
                memberFailed[memberName] = failed;
              }
            }

            if (participants === '') {
              participants = memberName;

            } else {
              participants = participants + ', ' + memberName;
            }
          });
        });

        if (weighted)
          factionMoney = factionMoney + (crime.money_gain)

        else {
          if (split == 5) { factionMoney = factionMoney + (crime.money_gain / split); }
          if (split == 4) { factionMoney = 0; }
        }

        factionSuccess = factionSuccess + success;
        factionFailed = factionFailed + failed;
        totalRespect = totalRespect + crime.respect_gain;
        totalMoney = totalMoney + crime.money_gain;

        var formatted_date = ts.toISOString().replace('T', ' ').replace('.000Z', '');

        table = table + '<tr>'
          + '<td>' + formatted_date + '</td>'
          + '<td>' + participants + '</td>'
          + '<td>' + crime.crime_name + '</td>'
          + '<td>' + crimeResult + '</td>'
          + '<td>$' + crime.money_gain.toLocaleString('en-US') + '</td>'
          + '<td>' + crime.respect_gain + '</td>'
          + '</tr>';
      }
    }
  }

  if (factionFailed > 0) { badgeFailed = 'badge-danger'; }
  if (factionSuccess > 0) { badgeSuccess = 'badge-success'; }

  table = table + '<tr class="table-dark">'
    + '<td colspan = "3">Totals</td>'
    + '<td>'
    + '<span class="badge badge-pill ' + badgeFailed + '">' + factionFailed + '</span>-'
    + '<span class="badge badge-pill ' + badgeSuccess + '">' + factionSuccess + '</span>'
    + '</td>'
    + '<td>$' + totalMoney.toLocaleString('en-US') + '</td>'
    + '<td>' + totalRespect + '</td>'
    + '</tr>';

  table = table + '</tbody></table>';
  document.getElementById(element).innerHTML = table;

  var multiplier = 0;
  var numberOfTeams = paLeads.split(';').length - 1;

  var summary = '<div class="col-sm-12 badge-primary" ><b>Individual results for ' + monthToText(currentMonth) + '</b> <input type="button" class="btn btn-outline-light btn-sm" value="select table content" onclick="selectElementContents( document.getElementById(\'individual\') );"></div>';
  summary = summary + '<br />';
  summary = summary + '<table class="table table-hover" id="individual"><thead><tr>'
    + '<th>Name</th>';

  if (weighted) {
    summary = summary + '<th>Money earned (weighted per PA rank)</th>';
  } else {
    summary = summary + '<th>Money earned (<sup>1</sup>/<sub>' + split + '</sub>th of result)</th>';
  }

  summary = summary + '<th>Fail</th>'
    + '<th>Success</th>'
    + '</tr></thead><tbody>';

  memberMoney = sortObj(memberMoney);

  for (var name in memberMoney) {
    if (memberFailed[name] > 0) { badgeFailed = 'badge-danger'; } else { badgeFailed = 'badge-dark'; }
    if (memberSuccess[name] > 0) { badgeSuccess = 'badge-success'; } else { badgeSuccess = 'badge-dark'; }

    if (name.startsWith('1|')) multiplier = 0.4 / numberOfTeams;
    if (name.startsWith('2|')) multiplier = 0.3 / numberOfTeams;
    if (name.startsWith('3|')) multiplier = 0.2 / numberOfTeams;
    if (name.startsWith('4|')) multiplier = 0.1 / numberOfTeams;

    summary = summary + '<tr>'
      + '<td>' + name + '</td>';

    if (!weighted) {
      summary = summary + '<td>' + ' $' + memberMoney[name].toLocaleString('en-US') + '</td>';
    }
    else {
      summary = summary + '<td>' + ' $' + (factionMoney * multiplier).toLocaleString('en-US') + '</td>';
    }

    summary = summary + '<td><span class="badge badge-pill ' + badgeFailed + '">' + memberFailed[name] + '</span></td>'
      + '<td><span class="badge badge-pill ' + badgeSuccess + '">' + memberSuccess[name] + '</span></td>'
      + '</tr>';

  }
  badgeSuccess = 'badge-dark';
  badgeFailed = 'badge-dark';
  if (factionFailed > 0) { badgeFailed = 'badge-danger'; }
  if (factionSuccess > 0) { badgeSuccess = 'badge-success'; }
  summary = summary + '<tr class="table-dark">'
    + '<td>Faction totals</td>'
    + '<td>' + ' $' + factionMoney.toLocaleString('en-US') + '</td>'
    + '<td><span class="badge badge-pill ' + badgeFailed + '">' + factionFailed + '</span></td>'
    + '<td><span class="badge badge-pill ' + badgeSuccess + '">' + factionSuccess + '</span></td>'
    + '</tr>';
  summary = summary + '</tbody></table>';



  document.getElementById('summary').innerHTML = summary;

}

function parseOCs(crimeData, element, membersList) {

  var memberStatus = {};
  var memberSuccess = {};
  var memberFailed = {};
  var factionMoney = 0;
  var factionSuccess = 0;
  var factionFailed = 0;
  var totalRespect = 0;
  var totalMoney = 0;
  var today = new Date();
  var badgeSuccess = 'badge-dark';
  var badgeFailed = 'badge-dark';

  if (document.getElementById('current').checked) {
    var currentMonth = today.getMonth() + 1;
    if (currentMonth > 11) { currentMonth = 0; }
  }
  if (document.getElementById('last').checked) {
    var currentMonth = today.getMonth();
    if (currentMonth == 0) { currentMonth = 12; }
  }
  if (document.getElementById('before').checked) {
    var currentMonth = today.getMonth() - 1;
    if (currentMonth == 0) { currentMonth = 12; }
    if (currentMonth < 0) { currentMonth = 11; }
  }

  var crimeList = '';
  if (document.getElementById('PoliticalAssassination').checked) {
    crimeList = document.getElementById('PoliticalAssassination').value + ',' + crimeList;
  }
  if (document.getElementById('PlaneHijacking').checked) {
    crimeList = document.getElementById('PlaneHijacking').value + ',' + crimeList;
  }
  if (document.getElementById('TakeOverACruiseLiner').checked) {
    crimeList = document.getElementById('TakeOverACruiseLiner').value + ',' + crimeList;
  }
  if (document.getElementById('RobbingOfAMoneyTrain').checked) {
    crimeList = document.getElementById('RobbingOfAMoneyTrain').value + ',' + crimeList;
  }
  if (document.getElementById('PlannedRobbery').checked) {
    crimeList = document.getElementById('PlannedRobbery').value + ',' + crimeList;
  }
  if (document.getElementById('BombThreat').checked) {
    crimeList = document.getElementById('BombThreat').value + ',' + crimeList;
  }
  if (document.getElementById('Kidnapping').checked) {
    crimeList = document.getElementById('Kidnapping').value + ',' + crimeList;
  }
  if (document.getElementById('Blackmailing').checked) {
    crimeList = document.getElementById('Blackmailing').value + ',' + crimeList;
  }

  var table = '<div class="col-sm-12 badge-primary" ><b>Organized Crime Overview for ' + monthToText(currentMonth) + '</b> <input type="button" class="btn btn-outline-light btn-sm" value="select table content" onclick="selectElementContents( document.getElementById(\'totals\') );"></div>';
  table = table + '<br />';

  table = table + '<table class="table table-hover" id="organizedcrimes"><thead><tr>'
    + '<th>Date</th>'
    + '<th>Participants</th>'
    + '<th>Crime Type</th>'
    + '<th>Result</th>'
    + '<th>Money Gained<br/>'
    + '<th>Respect Gained</th>'
    + '</tr></thead><tbody>';


  for (var id in crimeData) {
    var crime = crimeData[id];

    if (crimeList.includes(crime.crime_id)) {
      // 8 = Political Assassination
      // 7 = Plane hijacking
      // 6 = Take over a cruise liner
      // 5 = Robbing of a money train
      // 4 = Planned robbery
      // 3 = Bomb Threat
      // 2 = Kidnapping
      // 1 = Blackmailing
      var ts = new Date(crime.time_completed * 1000);

      if (crime.initiated === 1 && ts.getMonth() + 1 === currentMonth) {

        var crimeResult = '';
        var failed = 0;
        var success = 0;
        var participants = '';
        var tmp = '';

        if (crime.success === 0) {
          crimeResult = '<span class="badge badge-pill badge-danger">Failed</span>';
          failed = 1;
        } else {
          crimeResult = '<span class="badge badge-pill badge-success">Success</span>';
          success = 1;
        }

        crime.participants.forEach(obj => {
          Object.entries(obj).forEach(([key, value]) => {
            var memberID = `${key}`;

            var memberName = '';
            if (membersList.hasOwnProperty(memberID)) {
              memberName = membersList[memberID].name;
              if (memberName in memberStatus) {
                memberStatus[memberName] = memberStatus[memberName] + 1;
                memberSuccess[memberName] = memberSuccess[memberName] + success;
                memberFailed[memberName] = memberFailed[memberName] + failed;
              } else {
                memberStatus[memberName] = 1;
                memberSuccess[memberName] = success;
                memberFailed[memberName] = failed;
              }
            } else {
              memberName = memberID;
            }

            if (participants === '') {
              participants = memberName;

            } else {
              participants = participants + ', ' + memberName;
            }
          });
        });

        factionSuccess = factionSuccess + success;
        factionFailed = factionFailed + failed;
        totalRespect = totalRespect + crime.respect_gain;
        totalMoney = totalMoney + crime.money_gain;

        var formatted_date = ts.toISOString().replace('T', ' ').replace('.000Z', '');

        table = table + '<tr>'
          + '<td>' + formatted_date + '</td>'
          + '<td>' + participants + '</td>'
          + '<td>' + crime.crime_name + '</td>'
          + '<td>' + crimeResult + '</td>'
          + '<td>$' + crime.money_gain.toLocaleString('en-US') + '</td>'
          + '<td>' + crime.respect_gain + '</td>'
          + '</tr>';
      }
    }
  }

  if (factionFailed > 0) { badgeFailed = 'badge-danger'; }
  if (factionSuccess > 0) { badgeSuccess = 'badge-success'; }

  table = table + '</tbody><tfoot><tr class="table-dark">'
    + '<td colspan="3">Totals</td>'
    + '<td>'
    + '<span class="badge badge-pill ' + badgeFailed + '">' + factionFailed + '</span>-'
    + '<span class="badge badge-pill ' + badgeSuccess + '">' + factionSuccess + '</span>'
    + '</td>'
    + '<td>$' + totalMoney.toLocaleString('en-US') + '</td>'
    + '<td>' + totalRespect + '</td>'
    + '</tr>';

  table = table + '</tfoot></table>';

  $(document).ready(function () {
    $('#organizedcrimes').DataTable({
      "paging": false,
      "order": [[1, "asc"]],
      "info": false,
      "stateSave": true
    });
  });

  document.getElementById(element).innerHTML = table;

}

function checkAPIKey() {
  var trustedApiKey = document.getElementById("trustedkey").value;

  if (trustedApiKey.length == 16) {

    callTornAPI(trustedApiKey, 'torn', 'rankedwars', 'getWarringFactions');

  }
}

function hideElementByID(element) {
  //document.getElementById(element).hidden = "true";
  if (document.getElementById('btnHideFilter').innerHTML == 'Hide Filter') {
    document.getElementById('btnHideFilter').innerHTML = 'Show Filter';
    document.getElementById(element).hidden = true;
  } else {
    document.getElementById('btnHideFilter').innerHTML = 'Hide Filter';
    document.getElementById(element).hidden = false;
  }
}

function printAlert(alertType, alertText) {
  var alertClass, apiKeyForm;
  if (alertType === 'Error') { alertClass = 'alert-danger'; apiKeyForm = 'form-control is-invalid'; };
  if (alertType === 'Success') { alertClass = 'alert-success'; apiKeyForm = 'form-control is-valid'; };
  if (alertType === 'Info') { alertClass = 'alert-info'; apiKeyForm = 'form-control is-valid'; };
  if (alertType === 'Warning') { alertClass = 'alert-warning'; apiKeyForm = 'form-control is-invalid'; };
  if (alertType === '#chedded') { alertClass = 'alert-danger'; apiKeyForm = 'form-control is-invalid'; };

  document.getElementById('alert').innerHTML = '<div class="alert ' + alertClass + '"><strong>' + alertType + ':</strong> ' + alertText + '</div>';
  document.getElementById('trustedkey').className = apiKeyForm;
}

function sortObj(obj) {
  return Object.keys(obj).sort().reduce(function (result, key) {
    result[key] = obj[key];
    return result;
  }, {});
}

function monthToText(month) {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return monthNames[month - 1];
}

function selectElementContents(el) {
  var body = document.body, range, sel;
  if (document.createRange && window.getSelection) {
    range = document.createRange();
    sel = window.getSelection();
    sel.removeAllRanges();
    try {
      range.selectNodeContents(el);
      sel.addRange(range);
    } catch (e) {
      range.selectNode(el);
      sel.addRange(range);
    }
  } else if (body.createTextRange) {
    range = body.createTextRange();
    range.moveToElementText(el);
    range.select();
  }
}

function loadKeyFromLocalStorage() {
  if (storageAvailable('localStorage') && typeof (Storage) !== "undefined") {
    let localStorageApiKey = localStorage.getItem('api_key') || "";
    if (sessionStorage.trustedApiKey === '' || !sessionStorage.trustedApiKey) {
      sessionStorage.trustedApiKey = localStorageApiKey;
    }
  }
}

function loadFiltersFromLocalStorage() {
  if (storageAvailable('localStorage') && typeof (Storage) !== "undefined") {
    let localStorageDetailsList = localStorage.getItem('detailsList') || "";
    if (sessionStorage.detailsList === '' || !sessionStorage.detailsList) {
      sessionStorage.detailsList = localStorageDetailsList;
    }

    let localStorageStatusList = localStorage.getItem('statusList') || "";
    if (sessionStorage.statusList === '' || !sessionStorage.statusList) {
      sessionStorage.statusList = localStorageStatusList;
    }
  }
}

function loadFiltersFromSession() {
  loadFiltersFromLocalStorage();

  if (typeof (Storage) !== "undefined") {

    let markedCheckboxDetails = document.getElementsByName('details');
    for (let checkbox of markedCheckboxDetails) {
      if (sessionStorage.detailsList) {
        if (sessionStorage.detailsList.includes(checkbox.value)) document.getElementById(checkbox.value).checked = true;
      } else {
        if (checkbox.value !== 'MinutesHosp') document.getElementById(checkbox.value).checked = true;
      }
    }

    let markedCheckboxStatus = document.getElementsByName('status');
    for (let checkbox of markedCheckboxStatus) {
      if (sessionStorage.statusList) {
        if (sessionStorage.statusList.includes(checkbox.value)) document.getElementById(checkbox.value).checked = true;
      } else {
        if (checkbox.value !== 'FilterActive') document.getElementById(checkbox.value).checked = true;
      }
    }
  }

}

function loadKeyFromSession(selection) {
  loadKeyFromLocalStorage();
  var paramFactionID = getUrlParam('factionID', 'NOT_SET');

  if (paramFactionID != 'NOT_SET') {
    sessionStorage.factionid = paramFactionID;
  }

  if (typeof (Storage) !== "undefined") {
    if (sessionStorage.factionid) {
      if (document.getElementById("factionid")) {
        document.getElementById("factionid").value = sessionStorage.factionid;
      }
    }
    if (sessionStorage.trustedApiKey) {
      if (document.getElementById("trustedkey")) {
        document.getElementById("trustedkey").value = sessionStorage.trustedApiKey;
      }
    }
  }

  if (selection == 'members') {
    if (paramFactionID != 'NOT_SET') {
      userSubmit('members');
    }
  }
}

function copyButton(memberID, factionID = '') {

  var statsElement = document.getElementById('stats_a_' + memberID);
  var stats = '';

  if (statsElement) {
    stats = document.getElementById('stats_a_' + memberID).innerHTML.replaceAll(',', '');
    stats = ' || ' + abbreviateNumber(stats);
  }


  userSubmit('members');

  setTimeout(function () {
    var copyText = document.getElementById('copy-input-' + memberID);
    navigator.clipboard.writeText(copyText.value + stats);
  }, 1000);
}

function disableElement(source, target) {
  document.getElementById(target).disabled = !document.getElementById(source).checked;
}

function getUrlVars() {
  var vars = {};
  var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
    vars[key] = value;
  });
  return vars;
}

function getUrlParam(parameter, defaultvalue) {
  var urlparameter = defaultvalue;
  if (window.location.href.indexOf(parameter) > -1) {
    urlparameter = getUrlVars()[parameter];
  }
  return urlparameter;
}

(function () {
  loadKeyFromSession();
})();


function abbreviateNumber(value) {
  var newValue = value;
  if (value >= 1000) {
    var suffixes = ["", "k", "m", "b", "t", "wtf"];
    var suffixNum = Math.floor(("" + value).length / 3);
    var shortValue = '';
    for (var precision = 2; precision >= 1; precision--) {
      shortValue = parseFloat((suffixNum != 0 ? (value / Math.pow(1000, suffixNum)) : value).toPrecision(precision));
      var dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g, '');
      if (dotLessShortValue.length <= 2) { break; }
    }
    if (shortValue % 1 != 0) shortValue = shortValue.toFixed(1);
    newValue = shortValue + suffixes[suffixNum];
  }
  return newValue;
}


//IndexedDB shenanigans
function checkIndexedDBSupport() {
  if (!window.indexedDB) {
    console.log(`Your browser doesn't support IndexedDB`);
    return false;
  } else {
    //console.log(`Your browser does support IndexedDB`);
    return true;
  }
}


function openIndexedDB(dbName, version) {
  var idbRequest = indexedDB.open(dbName, version);
  return idbRequest;
}

function initializeIndexedDB(request, object) {
  // create the object store and indexes
  request.onupgradeneeded = (event) => {
    let db = event.target.result;

    // create the object store 
    // with auto-increment id
    let store = db.createObjectStore(object, {
      autoIncrement: true
    });

    // create an index on the playerID property
    let index = store.createIndex('playerID', 'playerID', {
      unique: true
    });
  };
}

function insertPlayer(request, object, player) {
  request.onsuccess = (event) => {
    const db = event.target.result;

    // create a new transaction
    const txn = db.transaction(object, 'readwrite');

    // get the player object store
    const store = txn.objectStore(object);
    //
    let query = store.put(player);

    // handle success case
    query.onsuccess = function (event) {
      console.log(event);
    };

    // handle the error case
    query.onerror = function (event) {
      console.log(event.target.errorCode);
    }

    // close the database once the 
    // transaction completes
    txn.oncomplete = function () {
      db.close();
    };
  }

}


function getPlayerById(request, object, id) {
  request.onsuccess = (event) => {
    const db = event.target.result;
    const txn = db.transaction(object, 'readonly');
    const store = txn.objectStore(object);

    let player = store.index("playerID");

    let query = player.get(id);

    query.onsuccess = (event) => {
      if (!event.target.result) {
        console.log(`The ${object} with ${id} not found`);
      } else {
        let result = event.target.result


        var ts = new Date(result.timestamp * 1000);

        var stats = '&nbsp;Dex:&nbsp;' + abbreviateNumber(result.dexterity).toLocaleString('en-US')
          + ',&nbsp;Def:&nbsp;' + abbreviateNumber(result.defense).toLocaleString('en-US')
          + ',&nbsp;Str:&nbsp;' + abbreviateNumber(result.strength).toLocaleString('en-US')
          + ',&nbsp;Spd:&nbsp;' + abbreviateNumber(result.speed).toLocaleString('en-US');


        document.getElementById('stats_' + id).innerHTML =
          abbreviateNumber(result.total).toLocaleString('en-US')
          + '&nbsp;<span class="text-muted">' + stats + '</div>'
          + '<div class="text-secondary">' + ts.toISOString().substring(0, ts.toISOString().indexOf('T')) + '</div>'
          ;

      }
    };

    query.onerror = (event) => {
      console.log(event.target.errorCode);
    }

    txn.oncomplete = function () {
      db.close();
    };
  };
}