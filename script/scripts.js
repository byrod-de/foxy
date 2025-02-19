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

  if (trustedApiKey === '' || trustedApiKey == null || trustedApiKey == undefined || trustedApiKey == 'null') {
    printAlert('Warning', 'You might want to enter your API key if you expect this to work...');
  } else {

    if (selection == 'pa_planner') {
      callTornAPI(trustedApiKey, 'faction', 'basic,crimeexp', 'pa_planner');
    }

    if (selection == 'pa_payouts') {

      var today = new Date();
      var firstDayOfMonth, lastDayOfMonth;
      var selectedMonthValue = document.getElementById('monthSelect').value;

      // Calculate the month offset based on selectedMonthValue
      var monthOffset = parseInt(selectedMonthValue);

      // Calculate timestamps using the offset
      var currentMonth = today.getMonth();
      var timestamps = calculateMonthTimestamps(today, currentMonth - monthOffset, 192);

      var firstDayOfMonth = timestamps.firstDay;
      var lastDayOfMonth = timestamps.lastDay;
      callTornAPI(trustedApiKey, 'faction', 'basic,crimes', 'pa_payouts', firstDayOfMonth, lastDayOfMonth);
    }

    if (selection == 'oc_overview') {

      var today = new Date();
      var firstDayOfMonth, lastDayOfMonth;
      var selectedMonthValue = document.getElementById('monthSelect').value;

      // Calculate the month offset based on selectedMonthValue
      var monthOffset = parseInt(selectedMonthValue);

      // Calculate timestamps using the offset
      var currentMonth = today.getMonth();
      var timestamps = calculateMonthTimestamps(today, currentMonth - monthOffset, 192);

      var firstDayOfMonth = timestamps.firstDay;
      var lastDayOfMonth = timestamps.lastDay;
      callTornAPI(trustedApiKey, 'faction', 'basic,crimes', 'oc_overview', firstDayOfMonth, lastDayOfMonth);

    }

    if (selection == 'oc2_center') {
      const category = document.getElementsByName('categoryRadio');
      let selectedCategory = '';
      for (let radio of category) {
        if (radio.checked) selectedCategory = radio.value;
      }
      console.log(selectedCategory);
      callTornAPIv2(trustedApiKey, 'faction', 'basic,crimes,members', 'oc2_center', selectedCategory);
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

    if (selection == 'trailers') {
      callTornAPI(trustedApiKey, 'user', 'basic,properties', 'trailers');
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

            let statsModalBody = '';

            statsModalBody = '<div class="alert alert-info"><strong>Warning: </strong>Spy not found on Tornstats.</div>';

            var innerRequest = new XMLHttpRequest();

            innerRequest.open('GET', 'https://api.torn.com/user/' + id + '?selections=personalstats,profile&key=' + apiKey + '&comment=tornengine', true);

            innerRequest.onload = function () {

              var innerJsonData = JSON.parse(this.response);

              if (innerRequest.status >= 200 && innerRequest.status < 400) {
                document.getElementById('statsModalLabel').innerHTML = '<strong>Player:</strong> ' + innerJsonData.name + ' [' + innerJsonData.player_id + '] <a href="https://www.torn.com/loader.php?sid=attack&user2ID=' + innerJsonData.player_id + '" target="_blank"><img src="images/svg-icons/attack2.svg" height="25" alt="Attack" title="Attack" /></a>';


                statsModalBody = statsModalBody + '<div class="text-muted"><strong>Age:</strong> ' + innerJsonData.age.toLocaleString('en-US') + ' days </div>';


                for (var stat in innerJsonData.personalstats) {
                  if (stat === 'xantaken') statsModalBody = statsModalBody + '<div class="text-muted"><strong>Xanax Taken:</strong> ' + innerJsonData.personalstats[stat].toLocaleString('en-US') + '</div>';
                  if (stat === 'statenhancersused') statsModalBody = statsModalBody + '<div class="text-muted"><strong>SE Used:</strong> ' + innerJsonData.personalstats[stat].toLocaleString('en-US') + '</div>';
                  if (stat === 'consumablesused') statsModalBody = statsModalBody + '<div class="text-muted"><strong>Consumables Used:</strong> ' + innerJsonData.personalstats[stat].toLocaleString('en-US') + '</div>';
                  if (stat === 'refills') statsModalBody = statsModalBody + '<div class="text-muted"><strong>Refills:</strong> ' + innerJsonData.personalstats[stat].toLocaleString('en-US') + '</div>';
                }
              }
              document.getElementById('statsModalBody').innerHTML = statsModalBody;

            }
            innerRequest.send();

            document.getElementById('statsModalBody').innerHTML = statsModalBody;

          } else {

            var ts = new Date(jsonData.spy.timestamp * 1000);
            let statsModalBody = '';
            let compareList = 'Xanax Taken, Refills';

            document.getElementById('statsModalLabel').innerHTML = '<strong>Player:</strong> ' + jsonData.spy.player_name + ' [' + jsonData.spy.player_id + '] <a href="https://www.torn.com/loader.php?sid=attack&user2ID=' + jsonData.spy.player_id + '" target="_blank"><img src="images/svg-icons/attack2.svg" height="25" alt="Attack" title="Attack" /></a>';
            statsModalBody = '<div class="text-muted"><strong>Strength:</strong> ' + jsonData.spy.strength.toLocaleString('en-US') + '</div>'
              + '<div class="text-muted"><strong>Defense:</strong> ' + jsonData.spy.defense.toLocaleString('en-US') + '</div>'
              + '<div class="text-muted"><strong>Speed:</strong> ' + jsonData.spy.speed.toLocaleString('en-US') + '</div>'
              + '<div class="text-muted"><strong>Dexterity:</strong> ' + jsonData.spy.dexterity.toLocaleString('en-US') + '</div>'
              + '<div class="text-primary"><strong>Total:</strong> ' + jsonData.spy.total.toLocaleString('en-US') + '</div>'
              + '<br />'
              + '<div class="text-muted"><em>Update: ' + ts.toISOString().substring(0, ts.toISOString().indexOf('T')) + ' (' + jsonData.spy.type + ')</em></div>'
              + '<br />';

            for (var key in jsonData.compare.data) {
              if (compareList.includes(key)) statsModalBody = statsModalBody + '<div class="text-muted"><strong>' + key + ':</strong> ' + jsonData.compare.data[key].amount + '</div>'
            }

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

function callTornAPI(key, part, selection, source, fromTS = '', toTS = '') {

  var selectedID = '';
  let from = '', to = '';

  if (toTS > 0) to = `&to=${toTS}`;
  if (fromTS > 0) from = `&from=${fromTS}`;

  if (source == 'members') selectedID = document.getElementById("factionid").value;
  if (source == 'trailers') selectedID = document.getElementById("playerid").value;


  sessionStorage.factionid = selectedID;
  var url = 'https://api.torn.com/' + part + '/' + selectedID + '?selections=' + selection + from + to + '&key=' + key + '&comment=tornengine';

  var request = new XMLHttpRequest();

  request.open('GET', url, true);

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

        if (selection === 'basic,crimeexp' && source === 'pa_planner') {
          if (jsonData.hasOwnProperty('crimeexp') && jsonData.hasOwnProperty('members')) {
            printAlert('Success', 'The API Call successful, find the results below.');

            parseCrimeexp(jsonData['crimeexp'], 'output', jsonData['members']);
          } else {
            printAlert('Warning', 'Ask your faction leader for faction API permissions.');
          }
        }

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
          parseMembers(jsonData, selection, 'output', jsonData['members'], jsonData['ranked_wars'], jsonData['raid_wars']);
        }

        if (source === 'keycheck') {
          printAlert('Success', 'The API Call successful, find the results below.');
          parseKeyInfo(jsonData, selection, 'output', jsonData['selections']);
        }

        if (source === 'trailers') {
          printAlert('Success', 'The API Call successful, find the results below.');
          parsePropertyInfo(jsonData, 'properties', 'output');
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

function callTornAPIv2(key, part, selection, source, category = '') {

  let cat = '';

  if (category !== '') cat = `&cat=${category}`;

  var url = 'https://api.torn.com/v2/' + part + '/' + selection +'?key=' + key + cat + '&comment=tornengine';
  console.log(url);

  var request = new XMLHttpRequest();

  request.open('GET', url, true);

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

        if (selection === 'basic,crimes,members' && source === 'oc2_center') {
          if (jsonData.hasOwnProperty('crimes') && jsonData.hasOwnProperty('basic') && jsonData.hasOwnProperty('members')) {
            if (jsonData['crimes'][0]?.slots ?? undefined != undefined) {
              console.log('OC 2.0 detected');
              printAlert('Success', 'The API Call successful, find the results below.');
            } else {
              console.log('OC 1.0 detected');
              printAlert('ACHTUNG', 'Your selection did not return a valid OC 2.0 result, are you sure you migrated yet?');
            }

            parseOC2(jsonData, 'output');
          } else {
            printAlert('Warning', 'Ask your faction leader for faction API permissions.');
          }
        }
      }
    } else {
      printAlert('#chedded', 'Torn API is currently not available.');
    }
  }
  request.send();
}

function parseOC2(oc2Data, element) {
  var crimes = oc2Data['crimes'];
  var basic = oc2Data['basic'];
  var members = oc2Data['members'];

  const cardsContainer = document.getElementById('cardsContainer');
  cardsContainer.innerHTML = '';

  for (crime in crimes) {
    let crimeData = crimes[crime];

    const slots = crimeData.slots; //slots is an array of objects
    let slotsString = '';
    for (const slot of slots) {
        let badgeSuccessChance = 'badge-success';
        let badgeItemRequirement = 'badge-secondary';
        //members is an array of objects, the member id is in the element id
        const member = members.find(member => member.id === slot.user_id);
        let memberName = ''; 
        
        if (member !== undefined) memberName = '<a href="https://www.torn.com/profiles.php?XID=' + slot.user_id + '" target="_blank">' + member.name + ' [' + slot.user_id + ']</a>';
        if (member === undefined) memberName = '<span class="badge badge-pill badge-warning">no member assigned</span>';

        if (slot.success_chance >= 75) badgeSuccessChance = 'badge-success';
        if (slot.success_chance >= 50 && slot.success_chance < 75) badgeSuccessChance = 'badge-warning';
        if (slot.success_chance < 50) badgeSuccessChance = 'badge-danger';
        if (slot.user_id === null) badgeSuccessChance = 'badge-secondary';

        const succesIcon = '<span class="badge badge-pill ' + badgeSuccessChance + '">' + slot.success_chance + '</span>';

        let itemIconText = 'no item required';
        if (slot.item_requirement !== null) {
            if (slot.item_requirement.is_available === false) {
              badgeItemRequirement = 'badge-danger';
              itemIconText = 'item not available';
            }
            if (slot.item_requirement.is_available === true) {
              badgeItemRequirement = 'badge-success';
              itemIconText = 'item available';
            }
        }
        const itemIcon = '<span class="badge badge-pill ' + badgeItemRequirement + '">' + itemIconText + '</span>';
        let progressbar = '';
        let userDetails = '';
        if (slot.user !== null) {
          userDetails = `${succesIcon} | ${itemIcon}`;
          progressbar = '<div class="progress"><div class="progress-bar progress-bar-striped bg-info" role="progressbar" style="width: ' + slot.user.progress + '%" aria-valuenow="' + slot.user.progress + '" aria-valuemin="0" aria-valuemax="100">' + slot.user.progress + '</div></div>';
        }
        
       

        slotsString += `<b>${slot.position}</b> - ${memberName}<br />${userDetails}<br />${progressbar}<br />`;
    }

    let rewards = '';
    if (crimeData.status === 'Successful') {
      const money = crimeData.rewards.money;
      let items = crimeData.rewards.items.join(', ');
      if (items === '') items = '<i>no items</i>';
      const respect = crimeData.rewards.respect;
      rewards = '<span class="text-success">Rewards: $' + abbreviateNumber(money) + ', ' + items + ', ' + respect + ' respect</span><br />';
    }

    //create card for each crime
    const header = crimeData.name;
    let color = 'primary';
    switch (crimeData.status) {
      case 'Recruiting': color = 'primary'; break;
      case 'Planning': color = 'info'; break;
      case 'Successful': color = 'success'; break;
      case 'Failed': color = 'warning'; break;
      case 'Expired': color = 'secondary'; break;
      default: color = 'primary'; break;
    }

    let formatted_date = 'N/A';
    formatted_date = 'Created at ' + new Date(crimeData.created_at * 1000).toISOString().replace('T', ' ').replace('.000Z', '') + '<br />';

    if (crimeData.ready_at > 0 && crimeData.ready_at !== null) {
       formatted_date += 'Ready at ' + new Date(crimeData.ready_at * 1000).toISOString().replace('T', ' ').replace('.000Z', '');
    }
    const title = 'ID: ' + crimeData.id + ' - <span class="badge badge-pill badge-' + color + '">Status: ' + crimeData.status + '</span>';
    const text = rewards + formatted_date + '<br />' + slotsString;

    const card = document.createElement('div');
    card.classList.add('card', `border-${color}`, 'mb-4');
    card.style.maxWidth = '20rem';

    const cardHeader = document.createElement('div');
    cardHeader.classList.add('card-header', `bg-${color}`, 'text-white');
    cardHeader.textContent = header;
    card.appendChild(cardHeader);

    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');
    card.appendChild(cardBody);

    const cardTitle = document.createElement('strong');
    cardTitle.classList.add('card-title');
    cardTitle.innerHTML = title;
    cardBody.appendChild(cardTitle);

    const cardText = document.createElement('p');
    cardText.classList.add('card-text');
    cardText.innerHTML = text;
    cardBody.appendChild(cardText);

    const col = document.createElement('div');
    col.classList.add('col-md-3', 'mb-3');
    col.appendChild(card);
    cardsContainer.appendChild(col);
  }

}

function parsePropertyInfo(propertyInfoData, selection, element) {
  let countOwn = 0;
  let countSpouse = 0;

  const name = propertyInfoData['name'];
  const player_id = propertyInfoData['player_id'];
  const propertyData = propertyInfoData[selection];

  for (const key in propertyData) {
    const property = propertyData[key].property;
    const status = propertyData[key].status;
    if (property === 'Trailer') {
      if (status === 'Owned by them') {
        countOwn++;
      }
      if (status === 'Owned by their spouse') {
        countSpouse++;
      }
    }
  }

  let value = '<div class="alert alert-secondary"><a class="alert-link" href="https://www.torn.com/profiles.php?XID=' + player_id + '" target="_blank">' + name + ' [' + player_id + ']</a>:<br />There are <span class="badge badge-primary">' + countOwn + '</span> trailer(s) owned by them and <span class="badge badge-light">' + countSpouse + '</span> trailer(s) owned by their spouse.</div>'

  document.getElementById(element).innerHTML = value;

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


function parseCrimeexp(crimeexp, element, membersList) {

  var numberOfTeams = document.getElementById('numberOfTeams').innerHTML;
  var carriedTeams = document.getElementById('carriedTeams').innerHTML;

  function groupEntries(ids, numGroups, carriedTeam) {
    const groups = [];
    const numEntries = numGroups * 4;
  
    for (let i = 0; i < carriedTeam; i++) {
      const carriedGroup = [];
      carriedGroup.push(ids[0], ids[numEntries - 3 - i * 4], ids[numEntries - 2 - i * 4], ids[numEntries - 1 - i * 4]);
      groups.push(carriedGroup);
      ids = ids.slice(1);
    }
  
    for (let i = 0; i < numGroups - carriedTeam; i++) {
      const group = [];
      const start = i;
  
      group.push(ids[start]); // first element
      group.push(ids[(numGroups - carriedTeam) * 4 - 1 - i]); // last element
      group.push(ids[Math.floor(((numGroups - carriedTeam) * 4) / 2) - 1 - i]); // middle element (before)
      group.push(ids[Math.floor(((numGroups - carriedTeam) * 4) / 2) + i]); // middle element (after)
  
      groups.push(group);
    }
  
    return groups;
  }

  // Function to generate a color scale
  function getColorScale(numColors) {
    const colors = [];
    const colorScheme = [
      '#df691a', '#ff9900', '#ffcc00', '#ffff00',
      '#ccff00', '#99ff00', '#66ff00', '#33ff00',
      '#00ff33', '#00ff66', '#00ff99', '#00ffcc',
      '#00ffff', '#00ccff', '#0099ff', '#0066ff',
      '#0033ff', '#3300ff', '#6600ff', '#9900ff',
      '#cc00ff', '#ff00ff', '#ff00cc', '#ff0099',
      '#ff0066', '#ff0033'
    ];
  
    for (let i = 0; i < numColors; i++) {
      const color = colorScheme[i % colorScheme.length];
      colors.push(color);
    }
  
    return colors;
  }

  const groupedEntries = groupEntries(crimeexp, numberOfTeams, carriedTeams);	


  // Get the number of groups
  const numGroups = groupedEntries.length;

  // Generate the color scale
  const colorScale = getColorScale(numGroups);

  var table = `<div class="col-sm-12 badge-primary"><b>Member List by Crime Experience</b> <input type="button" class="btn btn-outline-light btn-sm" value="select table content" onclick="selectElementContents(document.getElementById('members'));"></div>`;
  table += '<br />';
  table += '<table class="table table-hover" id="members"><thead><tr>'
    + '<th>CE Rank</th>'
    + '<th>Member</th>'
    + '<th>PA Team</th>'
    + '</tr></thead><tbody>';


  for (let i = 0; i < crimeexp.length; i++) {
    const rank = i + 1;
    const member = membersList[crimeexp[i]].name;
    const groupIndex = groupedEntries.findIndex((group) => group.includes(crimeexp[i]));

    let paTeamName = '';
    if (groupIndex >= 0) {
      paTeamName = `PA Team ${groupIndex + 1}`;
    } else {
      paTeamName = '<span class="text-secondary">No PA Team</span>';
    }
    const color = colorScale[groupIndex];

    let entry = `<tr><td>${rank}</td><td><a href="https://www.torn.com/profiles.php?XID=${crimeexp[i]}" target="_blank">${member} [${crimeexp[i]}]</a></td><td style="color: ${color}">${paTeamName}</td></tr>`;
    table += entry;
  }

  table = table + '</tbody></table>';

  $(document).ready(function () {
    $('#members').DataTable({
      "paging": false,
      "order": [[0, "asc"]],
      "info": false,
      "stateSave": false
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


function parseMembers(statusData, selection, element, membersList, ranked_wars, raid_wars) {

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

  const territory_wars = statusData['territory_wars'];
  let membersOnDefendingWall = ['WallMembers'];
  let membersOnAssaultingWall = ['WallMembers'];

  for (let i = 0; i < territory_wars.length; i++) {
    let territory_war = territory_wars[i];
    if (territory_war.assaulting_faction === statusData.ID)
      membersOnAssaultingWall = membersOnAssaultingWall.concat(territory_war.assaulters);
    if (territory_war.defending_faction === statusData.ID)
      membersOnDefendingWall = membersOnDefendingWall.concat(territory_war.defenders);
  }

  var levelRange = slider.noUiSlider.get();

  var printEntry = false;

  var table = '<div class="col-sm-12 badge-primary" >  <b>Members Status of <img src="https://factiontags.torn.com/'
    + statusData.tag_image + '"> '
    + statusData.name
    + ' [' + statusData.ID + ']'
    + '';
  table = table + '</div></b>';
  table += '<div class="col-sm-12 badge-secondary" ><img alt="Reload" title="Reload" src="images/svg-icons/refresh.svg" height="25" onclick="userSubmit(\'members\')">'
    + '&nbsp;<img alt="select table content" title="select table content" src="images/svg-icons/text-selection.svg" height="25" onclick="selectElementContents(document.getElementById(\'members\'));">';

  if (integrateFactionStats) table += '&nbsp;<img alt="Get Faction Stats" title="Get Faction Stats from TornStats" src="images/svg-icons/stats.svg" height="25" onclick="callTornStatsAPI(\'' + trustedApiKey + '\', ' + statusData.ID + ', \'faction\', ' + cacheStats + ')"';

  table += '</div></div>';

  //if (integrateFactionStats) table = table + '<div class="float-right"><button type="button" onclick="callTornStatsAPI(\'' + trustedApiKey + '\', ' + statusData.ID + ', \'faction\', ' + cacheStats + ')" class="btn btn-primary btn-sm">Get Faction Stats</button></div>';



  table = table + '<br /><table class="table table-hover" id="members"><thead><tr>'
    + '<th>Name&nbsp;&nbsp;</th>'
    + '<th>Icons&nbsp;&nbsp;</th>'
    + '<th>Attack Link&nbsp;&nbsp;</th>'
    + '<th>Status&nbsp;&nbsp;</th>'
    + '<th>Details&nbsp;&nbsp;</th>'
    + '<th>Description&nbsp;&nbsp;</th>'
    + '<th>Last Action&nbsp;&nbsp;</th>'
    + '<th>Level&nbsp;&nbsp;</th>'
    + '<th>Position&nbsp;&nbsp;</th>';
  if (integrateFactionStats) table = table + '<th>Torn Stats&nbsp;&nbsp;</th>';
  table = table + '<th>Stats Popup&nbsp;&nbsp;</th>'

  table = table + '</tr></thead><tbody>';

  var statusFormat = '';
  var detailFormat = '';
  var countMembers = 0;
  var filteredMembers = 0;
  var statusDescriptionText = '';
  var uniquePositions = new Set();

  var timeStamp = Math.floor(Date.now() / 1000);
  var timeDifference = 0;

  for (var id in membersList) {

    printEntry = false;
    statusDescriptionText = '';

    var member = membersList[id];
    var memberStatusState = member.status.state;
    var hospitalTime = '';
    var isOnAssaultingWall = membersOnAssaultingWall.includes(parseInt(id));
    var isOnDefendingngWall = membersOnDefendingWall.includes(parseInt(id));

    uniquePositions.add(member.position);

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
    if (isOnAssaultingWall) {
      icon = icon + '<img src="images/icon_wall_assault.png" alt="On Wall" title="On Wall" width="20" height="20"/>&nbsp;';
    }
    if (isOnDefendingngWall) {
      icon = icon + '<img src="images/icon_wall_defend.png" alt="On Wall" title="On Wall" width="20" height="20"/>&nbsp;';
    }

    if (statusList.includes(member.last_action.status)
      && detailsList.includes(memberStatusState)
      && printEntry
      && (!document.getElementById(member.position) || document.getElementById(member.position).checked)
      && (member.level >= levelRange[0] && member.level <= levelRange[1])) {

      var copyableText = ' >> ' + member.name + ' << ' + hospitalTime.replace(' hrs ', ':').replace(' min ', ':').replace(' sec ', '') + ' || https://www.torn.com/loader.php?sid=attack&user2ID=' + id;

      table = table + '<tr>'

        + '<td class="align-middle"><a href="https://www.torn.com/profiles.php?XID=' + id + '" target="_blank">' + member.name + '<br/>[' + id + ']</a><br/></td>'
        + '<td class="align-middle">' + icon + '</td>'
        + '<td class="align-middle">'
        + '<div class="link-group" role="group">'
        + '<a class="btn btn-link btn-sm" role="button" href="https://www.torn.com/loader.php?sid=attack&user2ID=' + id + '" target="_blank"><img alt="Attack" title="Attack" src="images/svg-icons/attack2.svg" height="25"></a>&nbsp;'
        //+ '<button type="button" onclick="copyButton(' + id + ')" class="btn btn-secondary btn-sm" id="copy-button' + id + '" data-toggle="tooltip" data-placement="button" title="Copy for Faction Chat">'
        + '<img alt="Copy" title="Copy" src="images/svg-icons/copy.svg" height="25" onclick="copyButton(' + id + ')">'
        + '</div>'
        + '<input type="hidden" class="form-control" value="' + copyableText + '" placeholder="..." id="copy-input-' + id + '">'
        //+ 'Copy</button>'
        + '</td>'
        + '<td class="align-middle">' + '<span class="badge badge-pill ' + statusFormat + '">' + member.last_action.status + '</span>' + '</td>'
        + '<td class="align-middle">' + detail + '</td>'
        + '<td class="align-middle">' + statusDescriptionText + '</td>'
        + '<td class="align-middle">' + memberLastAction + '</td>'
        + '<td class="align-middle">' + member.level + '</td>'
        + '<td class="align-middle"><pre>' + member.position + '</pre></td>'


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
        + '<img alt="Show Stats" title="Show Stats" src="images/svg-icons/stats.svg" height="25" onclick="callTornStatsAPI(\'' + trustedApiKey + '\', ' + id + ', \'user\', false)" data-toggle="modal" data-target="#statsModal">'
        //+ '<button type="button" onclick="callTornStatsAPI(\'' + trustedApiKey + '\', ' + id + ', \'user\', false)" class="btn btn-secondary btn-sm" data-toggle="modal" data-target="#statsModal">Show Stats</button>'
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

  if (!document.getElementById(member.position)) generatePositionCheckboxes(uniquePositions);

  document.getElementById(element).innerHTML = table;

  var ts = new Date(timeStamp * 1000);
  var formatted_date = ts.toISOString().replace('T', ' ').replace('.000Z', '');

  const summary = `<span class="text-primary">${filteredMembers} members out of ${countMembers} total members filtered.</span> <span class="text-muted">Last refreshed: ${formatted_date}</span><div class="war-info"></div>`;
  document.getElementById('summary').innerHTML = summary;

  let war_info = '';
  const rankedWar = Object.values(ranked_wars)[0];
  if (rankedWar) {
    const factionIDs = Object.keys(rankedWar.factions);
    const faction1ID = factionIDs[0];
    const faction2ID = factionIDs[1];
    console.log(faction1ID, faction2ID, statusData.ID);

    if (faction1ID != statusData.ID.toString()) war_info += `<div>Ranked war opponent: <a href="members.html?factionID=${faction1ID}">${rankedWar.factions[faction1ID].name} [${faction1ID}]</a></div>`;
    if (faction2ID != statusData.ID.toString()) war_info += `<div>Ranked war opponent: <a href="members.html?factionID=${faction2ID}">${rankedWar.factions[faction2ID].name} [${faction2ID}]</a></div>`;
  }

  if (Array.isArray(raid_wars) && raid_wars.length > 0) {

    for (const raidWar of raid_wars) {
      console.log(raidWar['raiding_faction'], statusData.ID);
      if (raidWar['raiding_faction'] === statusData.ID) {
        war_info += `<div>Raid war opponent: <a href="members.html?factionID=${raidWar['defending_faction']}">${raidWar['defending_faction']}</a></div>`
      }
      if (raidWar['defending_faction'] === statusData.ID) {
        war_info += `<div>Raid war opponent: <a href="members.html?factionID=${raidWar['raiding_faction']}">${raidWar['raiding_faction']}</a></div>`
      }
    }
  }
  if (war_info.length > 0) {
    const button = `<button onclick="hideElementByID('war-details')" class="btn btn-outline-secondary btn-sm" id="btnHideWarDetails">Hide&nbsp;Details</button>`;
    document.getElementById('war-info').innerHTML = '<div class="war-details" id="war-details">' + war_info + '</div>' + button;
  }
}

function generatePositionCheckboxes(uniquePositions) {
  var additionalFiltersDiv = document.getElementById('additionalFilters');
  var positionCheckboxes = '';

  positionCheckboxes += '<legend>Positions</legend>';
  positionCheckboxes += '<fieldset class="form-group">';

  uniquePositions.forEach(function (position) {
    positionCheckboxes += '<div class="form-check">';
    positionCheckboxes += '<input class="form-check-input" type="checkbox" value="' + position + '" name="position" id="' + position + '" checked />';
    positionCheckboxes += '<label class="form-check-label" for="' + position + '">' + position + '</label>';
    positionCheckboxes += '</div>';
  });

  positionCheckboxes += '</fieldset>';

  additionalFiltersDiv.innerHTML = positionCheckboxes;
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
  var memberIds = {};
  var factionMoney = 0;
  var factionSuccess = 0;
  var factionFailed = 0;
  var totalRespect = 0;
  var totalMoney = 0;

  let badgeSuccess = 'badge-dark';
  let badgeFailed = 'badge-dark';

  const today = new Date();
  const currentMonth = today.getMonth();
  const PA_CRIME_ID = 8;

  var firstDayOfMonth, lastDayOfMonth;

  var selectedMonthValue = document.getElementById('monthSelect').value;
  var selectedMonthValue = document.getElementById('monthSelect').value;

  // Calculate the month offset based on selectedMonthValue
  var monthOffset = parseInt(selectedMonthValue);

  // Calculate timestamps using the offset
  var timestamps = calculateMonthTimestamps(today, currentMonth - monthOffset);
  var firstDayOfMonth = timestamps.firstDay;
  var lastDayOfMonth = timestamps.lastDay;

  var splitFactor = document.getElementById('range').value;
  var weightedPerRank = document.getElementById('weighted').checked;
  var paLeads = '';

  var selectElement = document.getElementById('monthSelect');
  var selectedOption = selectElement.options[selectElement.selectedIndex];
  var selectedMonthText = selectedOption.text;


  var table = `<div class="col-sm-12 badge-primary"><b>PA Details for ${selectedMonthText}</b> <input type="button" class="btn btn-outline-light btn-sm" value="select table content" onclick="selectElementContents(document.getElementById('totals'));"></div>`;
  table += '<br />';
  table += '<table class="table table-hover" id="totals"><thead><tr>'
    + '<th>Date</th>'
    + '<th>Participants</th>'
    + '<th>Crime Type</th>'
    + '<th>Result</th>'
    + '<th>Money Gained<br/>'
    + '<th>Respect Gained</th>'
    + '</tr></thead><tbody>';

  for (var id in crimeData) {
    var crime = crimeData[id];

    if (crime.crime_id === PA_CRIME_ID) {

      var ts = new Date(crime.time_completed * 1000);

      if (crime.initiated === 1 & crime.time_completed >= firstDayOfMonth && crime.time_completed <= lastDayOfMonth) {

        var crimeResult = '';
        var failed = 0;
        var success = 0;
        var participants = '';
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
            if (weightedPerRank) {
              prefix = countRank + '| ';
            }

            var memberName = '';
            if (membersList.hasOwnProperty(memberID)) {
              memberName = prefix + membersList[memberID].name;
              if (weightedPerRank && prefix === '1| ') {
                if (!paLeads.includes(memberName))
                  paLeads = memberName + ';' + paLeads;
              }
              if (memberName in memberMoney) {
                memberMoney[memberName] = memberMoney[memberName] + (crime.money_gain / splitFactor);
                memberSuccess[memberName] = memberSuccess[memberName] + success;
                memberFailed[memberName] = memberFailed[memberName] + failed;
                memberIds[memberName] = memberID;
              } else {
                memberMoney[memberName] = (crime.money_gain / splitFactor);
                memberSuccess[memberName] = success;
                memberFailed[memberName] = failed;
                memberIds[memberName] = memberID;
              }
            } else {
              memberName = memberID;

              if (memberName in memberMoney) {
                memberMoney[memberName] = memberMoney[memberName] + (crime.money_gain / splitFactor);
                memberSuccess[memberName] = memberSuccess[memberName] + success;
                memberFailed[memberName] = memberFailed[memberName] + failed;
              } else {
                memberMoney[memberName] = (crime.money_gain / splitFactor);
                memberSuccess[memberName] = success;
                memberFailed[memberName] = failed;
              }
            }

            if (participants === '') {
              let tmpName = memberName;
              if (!weightedPerRank) {
                tmpName = `<a href="https://www.torn.com/factions.php?step=your#/tab=controls&addMoneyTo=${memberID}&money=${memberMoney[memberName]}" target="_blank">${memberName} [${memberID}]</a>`;
              }
              participants = tmpName;
            } else {
              let tmpName = memberName;
              if (!weightedPerRank) {
                tmpName = `<a href="https://www.torn.com/factions.php?step=your#/tab=controls&addMoneyTo=${memberID}&money=${memberMoney[memberName]}" target="_blank">${memberName} [${memberID}]</a>`;
              }
              participants = participants + ', ' + tmpName;
            }
          });
        });

        if (weightedPerRank)
          factionMoney = factionMoney + (crime.money_gain)

        else {
          if (splitFactor == 5) { factionMoney = factionMoney + (crime.money_gain / splitFactor); }
          if (splitFactor == 4) { factionMoney = 0; }
        }

        factionSuccess = factionSuccess + success;
        factionFailed = factionFailed + failed;
        totalRespect = totalRespect + crime.respect_gain;
        totalMoney = totalMoney + crime.money_gain;

        var formatted_date = ts.toISOString().replace('T', ' ').replace('.000Z', '');

        table += '<tr>'
          + `<td>${formatted_date}</td>`
          + `<td>${participants}</td>`
          + `<td>${crime.crime_name}</td>`
          + `<td>${crimeResult}</td>`
          + `<td>$${crime.money_gain.toLocaleString('en-US')}</td>`
          + `<td>${crime.respect_gain}</td>`
          + `</tr>`;
      }
    }
  }

  if (factionFailed > 0) { badgeFailed = 'badge-danger'; }
  if (factionSuccess > 0) { badgeSuccess = 'badge-success'; }

  table += `</tbody><tfoot><tr class="table-dark">`
    + `<td>Totals</td>`
    + `<td></td>`
    + `<td></td>`
    + `<td>`
    + `<span class="badge badge-pill ${badgeFailed}">${factionFailed}</span>-`
    + `<span class="badge badge-pill ${badgeSuccess}">${factionSuccess}</span>`
    + `</td>`
    + `<td>$${totalMoney.toLocaleString('en-US')}</td>`
    + `<td>${totalRespect}</td>`
    + `</tr></tfoot>`;

  table = table + '</table>';
  document.getElementById(element).innerHTML = table;


  $(document).ready(function () {
    $('#totals').DataTable({
      "paging": false,
      "order": [[0, "asc"]],
      "info": false,
      "stateSave": true,
      "footer": true
    });
  });

  var multiplier = 0;
  var numberOfTeams = paLeads.split(';').length - 1;

  var summary = `<div class="col-sm-12 badge-primary" ><b>Individual results for ${selectedMonthText}</b> <input type="button" class="btn btn-outline-light btn-sm" value="select table content" onclick="selectElementContents( document.getElementById('individual') );"></div>`;
  summary += '<br />';
  summary += '<table class="table table-hover" id="individual"><thead><tr>'
    + '<th>Name</th>';

  if (weightedPerRank) {
    summary += '<th>Money earned (weighted per PA rank)</th>';
  } else {
    summary += `<th>Money earned (<sup>1</sup>/<sub>${splitFactor}</sub>th of result)</th>`;
  }

  summary += '<th>Fail</th>'
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
      + '<td>' + `<a href="https://www.torn.com/factions.php?step=your#/tab=controls&addMoneyTo=${memberIds[name]}&money=${memberMoney[name]}" target="_blank">${name}</a>` + '</td>';

    if (!weightedPerRank) {
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
  summary = summary + '</tbody><tfoot><tr class="table-dark">'
    + '<td>Faction totals</td>'
    + '<td>' + ' $' + factionMoney.toLocaleString('en-US') + '</td>'
    + '<td><span class="badge badge-pill ' + badgeFailed + '">' + factionFailed + '</span></td>'
    + '<td><span class="badge badge-pill ' + badgeSuccess + '">' + factionSuccess + '</span></td>'
    + '</tr></tfoot>';
  summary = summary + '</table>';

  document.getElementById('summary').innerHTML = summary;

  $(document).ready(function () {
    $('#individual').DataTable({
      "paging": false,
      "order": [[0, "asc"]],
      "info": false,
      "stateSave": true
    });
  });


}

function parseOCs(crimeData, element, membersList) {

  var memberStatus = {};
  var memberSuccess = {};
  var memberFailed = {};
  var factionSuccess = 0;
  var factionFailed = 0;
  var totalRespect = 0;
  var totalMoney = 0;

  var badgeSuccess = 'badge-dark';
  var badgeFailed = 'badge-dark';

  const today = new Date();
  const currentMonth = today.getMonth();

  var firstDayOfMonth, lastDayOfMonth;

  var selectedMonthValue = document.getElementById('monthSelect').value;
  var selectedMonthValue = document.getElementById('monthSelect').value;

  // Calculate the month offset based on selectedMonthValue
  var monthOffset = parseInt(selectedMonthValue);

  // Calculate timestamps using the offset
  var timestamps = calculateMonthTimestamps(today, currentMonth - monthOffset);
  var firstDayOfMonth = timestamps.firstDay;
  var lastDayOfMonth = timestamps.lastDay;

  var selectElement = document.getElementById('monthSelect');
  var selectedOption = selectElement.options[selectElement.selectedIndex];
  var selectedMonthText = selectedOption.text;

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

  var table = '<div class="col-sm-12 badge-primary" ><b>Organized Crime Overview for ' + selectedMonthText + '</b> <input type="button" class="btn btn-outline-light btn-sm" value="select table content" onclick="selectElementContents( document.getElementById(\'totals\') );"></div>';
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


      if (crime.initiated === 1 & crime.time_completed >= firstDayOfMonth && crime.time_completed <= lastDayOfMonth) {

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
  let buttonId = 'btnHideFilter';
  let label = 'Filter';
  if (element === 'war-details') {
    buttonId = 'btnHideWarDetails';
    label = 'Details';
  }
  if (document.getElementById(buttonId).innerHTML == `Hide&nbsp;${label}`) {
    document.getElementById(buttonId).innerHTML = `Show&nbsp;${label}`;
    document.getElementById(element).hidden = true;
  } else {
    document.getElementById(buttonId).innerHTML = `Hide&nbsp;${label}`;
    document.getElementById(element).hidden = false;
  }
}

function printAlert(alertType, alertText) {
  var alertClass, apiKeyForm;
  if (alertType === 'Error') { alertClass = 'alert-danger'; apiKeyForm = 'form-control is-invalid'; };
  if (alertType === 'Success') { alertClass = 'alert-success'; apiKeyForm = 'form-control is-valid'; };
  if (alertType === 'Info') { alertClass = 'alert-info'; apiKeyForm = 'form-control is-valid'; };
  if (alertType === 'Warning') { alertClass = 'alert-warning'; apiKeyForm = 'form-control is-invalid'; };
  if (alertType === 'ACHTUNG') { alertClass = 'alert-warning'; apiKeyForm = 'form-control is-invalid'; };
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
  var paramPlayerID = getUrlParam('playerID', 'NOT_SET');

  if (paramFactionID != 'NOT_SET') {
    sessionStorage.factionid = paramFactionID;
  }

  if (paramPlayerID != 'NOT_SET') {
    sessionStorage.playerid = paramPlayerID;
  }

  if (typeof (Storage) !== "undefined") {
    if (sessionStorage.factionid) {
      if (document.getElementById("factionid")) {
        document.getElementById("factionid").value = sessionStorage.factionid;
      }
    }

    if (sessionStorage.playerid) {
      if (document.getElementById("playerid")) {
        document.getElementById("playerid").value = sessionStorage.playerid;
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


function overrideMemberFilters() {
  const statusFilters = getUrlParam('status', 'NOT_SET');
  const detailsFilters = getUrlParam('details', 'NOT_SET');
  const activityFilter = getUrlParam('lastactive', 'NOT_SET');

  //console.log(statusFilters, detailsFilters);

  if (statusFilters != 'NOT_SET') {
    var markedCheckboxStatus = document.getElementsByName('status');
    for (var checkbox of markedCheckboxStatus) {
      var checkboxElement = document.getElementById(checkbox.id);
      if (checkboxElement) {
        checkboxElement.checked = false;
        if (statusFilters.includes(checkbox.value)) checkboxElement.checked = true;
        //console.log(checkbox.value, checkboxElement.checked);
      } else {
        console.log('Checkbox element not found:', checkbox.id);
      }
    }
  }

  if (activityFilter != 'NOT_SET') {
    var activityCheckbox = document.getElementById('FilterActive');
    if (activityCheckbox) {
      activityCheckbox.checked = false;
      if (activityFilter) {
        activityCheckbox.checked = true;
        document.getElementById('TimeActive').value = activityFilter;
        document.getElementById('rangeValue').innerHTML = activityFilter;
        document.getElementById('TimeActive').disabled = false;
      }
      //console.log(activityFilter, activityCheckbox.checked);

    }
    else {
      console.log('Checkbox element not found:', checkbox.id);
    }
  }

  if (detailsFilters != 'NOT_SET') {
    var markedCheckboxDetails = document.getElementsByName('details');
    for (var checkbox of markedCheckboxDetails) {
      var checkboxElement = document.getElementById(checkbox.id);
      if (checkboxElement) {
        checkboxElement.checked = false;
        if (detailsFilters.includes(checkbox.value)) checkboxElement.checked = true;
        //console.log(checkbox.value, checkboxElement.checked);
      } else {
        console.log('Checkbox element not found:', checkbox.id);
      }
    }
  }
}

function copyFilterAsURL(selection) {

  if (selection == 'members') {
    var siteUrl = "https://tornengine.netlify.app/members.html";

    const markedCheckboxStatus = document.getElementsByName('status');
    const markedCheckboxDetails = document.getElementsByName('details');
    const activityCheckbox = document.getElementById('FilterActive');
    const factionIDInput = document.getElementById('factionid').value;


    var statusList = "";
    var detailsList = "";
    var activityFilter = "";
    var factonID = "";

    for (var checkbox of markedCheckboxStatus) {
      if (checkbox.checked && checkbox.value != "FilterActive") {
        statusList = statusList + checkbox.value + ",";
      }
    }

    for (var checkbox of markedCheckboxDetails) {
      if (checkbox.checked) {
        detailsList = detailsList + checkbox.value + ",";
      }
    }

    if (activityCheckbox.checked) {
      activityFilter = document.getElementById('TimeActive').value;
    }

    if (statusList != "") {
      statusList = "&status=" + statusList.substring(0, statusList.length - 1);
    }
    if (detailsList != "") {
      detailsList = "&details=" + detailsList.substring(0, detailsList.length - 1);
    }

    if (activityFilter != "") {
      activityFilter = "&lastactive=" + activityFilter;
    }

    if (factionIDInput != "") {
      factonID = "&factionID=" + factionIDInput;
    }

    siteUrl = replaceFirstAmpersandWithQuestionMark(siteUrl + statusList + detailsList + activityFilter + factonID);

    console.log(siteUrl);

    setTimeout(function () {
      navigator.clipboard.writeText(siteUrl);
    }, 1000);

  }
}


function replaceFirstAmpersandWithQuestionMark(inputString) {
  var firstAmpersandIndex = inputString.indexOf('&');
  if (firstAmpersandIndex !== -1) {
    var modifiedString = inputString.substring(0, firstAmpersandIndex) + '?' + inputString.substring(firstAmpersandIndex + 1);
    return modifiedString;
  }
  return inputString;
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

// Function to calculate Unix timestamps for the first and last day of a selected month
function calculateMonthTimestamps(today, selectedMonth, offsetInHours = 0) {
  // Get the current year
  var currentYear = today.getFullYear();

  var firstDayOfMonth = new Date(currentYear, selectedMonth, 1).getTime() / 1000;
  var lastDayOfMonth = new Date(currentYear, selectedMonth + 1, 0, 23, 59, 59).getTime() / 1000;

  if (offsetInHours > 0) {
    firstDayOfMonth -= (offsetInHours + 36) * 60 * 60;
    lastDayOfMonth -= offsetInHours * 60 * 60;
  }

  return { firstDay: firstDayOfMonth, lastDay: lastDayOfMonth };
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
        //console.log(`The ${object} with ${id} not found`);
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

function monthSelection() {
  // Get the current date
  var currentDate = new Date();
  var currentYear = currentDate.getFullYear();
  var currentMonth = currentDate.getMonth() + 1; // Adding 1 to match the month format (1-12)

  // Create a reference date that represents the current month
  var referenceDate = new Date(currentYear, currentMonth - 1, 1); // Subtract 1 to get the current month (0-11)

  // Initialize an array to store the options
  var monthOptions = [];

  // Loop to generate options for the previous 12 months
  for (var i = 0; i < 12; i++) {
    // Calculate the year and month for the current option
    var year = referenceDate.getFullYear();
    var month = referenceDate.getMonth() + 1; // Adding 1 to match the month format (1-12)

    // Format the option label as "YYYY-MM"
    var optionLabel = year + '-' + (month < 10 ? '0' : '') + month;

    // Create an option element and add it to the array
    monthOptions.push('<option value="' + i + '">' + optionLabel + '</option>');

    // Move the reference date to the previous month for the next iteration
    referenceDate.setMonth(referenceDate.getMonth() - 1);
  }

  monthOptions.reverse();

  // Join the options and set them in the select element
  document.getElementById('monthSelect').innerHTML = monthOptions.reverse().join('');

}

/**
 * Format Discord timestamp based on user input and update the output.
 *
 * @param {void} None
 * @return {void} None
 */
function formatDiscordTimestamp() {
  const dateInput = document.getElementById('inputDate');
  const timeInput = document.getElementById('inputTime');
  const typeInput = document.getElementById('formatSelection');
  const output = document.getElementById('outputCode');
  const preview = document.getElementById('outputDate');
  const copyButton = document.getElementById('copyButton');
  const useGmtCheckbox = document.getElementById('useGmtCheckbox');

  const localTimezoneOffset = new Date().getTimezoneOffset() * 60 * 1000;

  dateInput.addEventListener('input', updateOutput);
  timeInput.addEventListener('input', updateOutput);
  typeInput.addEventListener('input', updateOutput);
  useGmtCheckbox.addEventListener('change', updateOutput);
  output.addEventListener('mouseover', function () { this.select(); });
  copyButton.addEventListener('click', async () => {
    updateOutput();
    try {
      await navigator.clipboard.writeText(output.value);
      output.className = 'form-control is-valid';
    } catch (e) {
      alert(e);
    }
  });

  const onload = _ => {
    const now = new Date();
    dateInput.value = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    timeInput.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    updateOutput();
  };
  window.onload = onload;

  const typeFormats = {
    't': { timeStyle: 'short' },
    'T': { timeStyle: 'medium' },
    'd': { dateStyle: 'short' },
    'D': { dateStyle: 'long' },
    'f': { dateStyle: 'long', timeStyle: 'short' },
    'F': { dateStyle: 'full', timeStyle: 'short' },
    'R': { style: 'long', numeric: 'auto' },
  };
  function automaticRelativeDifference(d) {
    const secondsDiff = Math.round((new Date() - d) / 1000) * -1;
    console.log('secondsDiff:', secondsDiff);

    if (secondsDiff > 86400 * 30 * 10) {
      const duration = Math.round(secondsDiff / (86400 * 365));
      console.log('duration (years):', duration);
      return { duration: duration, unit: 'years' };
    }
    if (secondsDiff > 86400 * 25) {
      const duration = Math.round(secondsDiff / (86400 * 30));
      console.log('duration (months):', duration);
      return { duration: duration, unit: 'months' };
    }
    if (secondsDiff > 3600 * 21) {
      const duration = Math.round(secondsDiff / 86400);
      console.log('duration (days):', duration);
      return { duration: duration, unit: 'days' };
    }
    if (secondsDiff > 60 * 44) {
      const duration = Math.round(secondsDiff / 3600);
      console.log('duration (hours):', duration);
      return { duration: duration, unit: 'hours' };
    }
    if (secondsDiff > 30) {
      const duration = Math.round(secondsDiff / 60);
      console.log('duration (minutes):', duration);
      return { duration: duration, unit: 'minutes' };
    }
    const duration = secondsDiff;
    console.log('duration (seconds):', duration);
    return { duration: duration, unit: 'seconds' };
  }

  function updateOutput() {
    const selectedTimeZone = useGmtCheckbox.checked ? 0 : localTimezoneOffset;
    const combinedMilliseconds = dateInput.valueAsNumber + timeInput.valueAsNumber + selectedTimeZone;
    const selectedDate = new Date(combinedMilliseconds);
    const timestamp = Math.floor(selectedDate.getTime() / 1000);
    output.value = `<t:${timestamp}:${typeInput.value}>`;

    console.log(selectedDate);
    console.log(combinedMilliseconds);
    console.log(timestamp);

    if (['R'].includes(typeInput.value)) {
      const formatter = new Intl.RelativeTimeFormat(navigator.language || 'en', typeFormats[typeInput.value] || {});
      const format = automaticRelativeDifference(selectedDate);
      console.log(format.duration, format.unit);
      preview.value = formatter.format(format.duration, format.unit);
    } else {
      const formatter = new Intl.DateTimeFormat(navigator.language || 'en', typeFormats[typeInput.value] || {});
      preview.value = formatter.format(selectedDate);
    }
  }
}
