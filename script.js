$(document).ready(function(){

	var server = 'http://192.168.1.8:5000/';
	var walletsList = {};

	var api = {
		wallet: {
			getInfo: name => new Promise((resolve, reject) => 
				$.ajax({
			        url: server + 'wallets/'+name+'/service',
			        method: 'GET',
			        cache: false,
			        dataType : 'JSON',
			        statusCode: {
			        	200: data => resolve(data),
			        	400: data => reject(data)
			        }      
			    })
			),
			 
			startGui: name => new Promise((resolve, reject) => 
				console.log('Starting GUI')
				// $.ajax({
			 //        url: server + 'wallets/'+name+'/service',
			 //        method: 'POST',
			 //        dataType : 'JSON',
			 //        statusCode: {
			 //        	201: data => resolve(data),
			 //        	400: data => reject(data)
			 //        }      
			 //    })
			),
			startWallet: name => new Promise((resolve, reject) => 
				$.ajax({
			        url: server + 'wallets/'+name+'/service',
			        method: 'POST',
			        dataType : 'JSON',
			        statusCode: {
			        	201: data => resolve(data),
			        	400: data => reject(data),
			        	404: () => reject()
			        }      
			    })
			),
			stopWallet: name => new Promise((resolve, reject) => 
				$.ajax({
			        url: server + 'wallets/'+name+'/service',
			        method: 'DELETE',
			        dataType : 'JSON',
			        statusCode: {
			        	201: data => resolve(data),
			        	400: data => reject(data),
			        	404: () => reject()
			        }      
			    })
			),

			encryptWallet: (name, data) => new Promise((resolve, reject) => 					
				$.ajax({
			        url: server + 'wallets/'+name+'/backup',
			        method: 'POST',
			        data: data,
			        dataType : 'JSON',
			        statusCode: {
			        	201: data => resolve(data),
			        	400: data => reject(data)
			        }      
				})
				
			),

			downloadBackup: name => window.location.href = server + 'wallets/'+name+'/backup',

			restoreWallet: (name, backup) => new Promise((resolve, reject) => {
				console.log(name)
						$.ajax({
							       url : server + 'wallets/'+name+'/backup',
							       type : 'PUT',
							       data : backup,
							       processData: false,  // tell jQuery not to process the data
							       contentType: false,  // tell jQuery not to set contentType
							       success : function(data) {
							           console.log(data);
							       }
							})

					}
				),

			unlockWallet: (name, data) => new Promise((resolve, reject) =>{
				//Getting as data Password, time to unlock and true/false if you want to unlock for sending and receiving coins
				console.log(name,data)
					// $.ajax({
					//        url : server + 'wallets/'+name+'/backup',
					//        type : 'PUT',
					//        data : data,
					//        processData: false,  // tell jQuery not to process the data
					//        contentType: false,  // tell jQuery not to set contentType
					//        success : function(data) {
					//            console.log(data);
					//        }
					// })

				}
			),
		},
		wifi: {
			scan: () => new Promise((resolve, reject) => 
				$.ajax({
			        url: server + 'wifi/networks',
			        method: 'GET',
			        dataType : 'JSON',
			        statusCode: {
			        	200: data => resolve(data),
			        	400: data => reject(data)
			        }      
			    })
			),

			connect: credentials => new Promise((resolve, reject) => 
				$.ajax({
			        url: server + 'wifi/network',
			        method: 'POST',
			        dataType : 'JSON',
			        data: credentials,
			        statusCode: {
			        	201: data => resolve(data),
			        	400: data => reject(data)
			        }      
			    })
			)
		},

		getWallets: () => new Promise((resolve, reject) => 
			$.ajax({
		        url: server + 'wallets',
		        method: 'GET',
		        dataType : 'JSON',
		        statusCode: {
		        	200: data => resolve(data),
		        	400: data => reject(data)
		        }      
		    })
		)	
	}

	var wifi = {
		scanButton: $('#scan-wifi'),
		connectButton: $('#wifi-connect'),
		selectedWifi: () => ({ ssid: wifi.selectedSsid(), password: wifi.selectedPassword() }),
		selectedSsid: () => $('#networkList').val(),
		selectedPassword: () => wifi.passwordField.val(),
		clearPasswordField: () => wifi.passwordField.val(''),
		passwordField: $('#wifiPassword'),
		wifiList: {
			list: $("#wifiConnect"),
			show: () => wifi.wifiList.list.css('display', 'inline-block'),
			hide: () => wifi.wifiList.list.css('display', 'none')
		},
		createWifi: (ssid) => `<option value="${ssid}">${ssid}</option>`,
		scann: () => api.wifi.scan()
		.then(response => response.networks)
		.then(networks => {
			$('#networkList').html('')
			networks.forEach(network => {
				$('#networkList').append(wifi.createWifi(network))
			})
			wifi.wifiList.show()
		}),
		connect: credentials => api.wifi.connect(credentials)
	}



	var walletFactory = () => {

		var _allWallets

		var walletsDiv = $('#wallets')
		var walletInfoDiv = $('#walletInfo')

		var newWallet = ({logo, key, name}) => 
			`<div class="col-md-4 wallet text-center">
				<a href="#"><img src="${logo}" class="walletImage" data-index="${key}" data-name="${name}" /></a>
			 </div>`

		var fetchWallets = () => 
			api.getWallets()
			.then(wallets => wallets.map(wallet => ({ logo: wallet.logo, name: wallet.name })))
			.then(wallets => {
				_allWallets = wallets.map(wallet => createWalletOb(wallet))
				_allWallets.forEach(_wallet => walletsDiv.append(newWallet(_wallet)))
			})
	

		var createWalletOb = ({name, logo}) => {
			var start = () => api.wallet.startWallet(name)
			var stop = () => api.wallet.stopWallet(name)
			var getInfo = () => api.wallet.getInfo(name)

			return { start, stop, name, logo, getInfo }
		}

		var wallet = name => _allWallets.find(_wallet => name === _wallet.name)

		return {
			createWalletOb,
			fetchWallets,
			allWallets: () => _allWallets,
			wallet,
			walletsDiv,
			walletInfoDiv,
		}
	}


var templates = {
		stopBtn: name => `<button class="walletBtn" id="stopWalletBtn" data-name="${name}">Stop</button>`,
		startBtn: name => `<button class="walletBtn" id="startWalletBtn" data-name="${name}">Start</button>`,
		walletInfo: info => {
			return `<div class="col-md-8 col-sm-12 walletInfo">
			 				<!--Info about selected wallet-->
			 				<table id="walletInfoTable" class="table">
				 				<tr>
				 					<td>Balance:</td><td>${info.details.balance}</td>
				 				</tr>
				 				<tr>
				 					<td>Blocks:</td><td>${info.details.blocks}</td>
				 				</tr>
				 				<tr>
				 					<td>Connections:</td><td>${info.details.connections}</td>
				 				</tr>
				 				<tr>
				 					<td>Proof of stake:</td><td>${info.details.difficulty['proof-of-stake']}</td>
				 				</tr>
				 				<tr>
				 					<td>Proof of Work:</td><td>${info.details.difficulty['proof-of-work']}</td>
				 				</tr>
				 				<tr>
				 					<td>Stake:</td><td>${info.details.stake}</td>
				 				</tr>
				 				<tr>
				 					<td>Test Network:</td><td>${info.details.testnet}</td>
				 				</tr>
				 				<tr>
				 					<td>Unlocked Time:</td><td>${info.details.unlocked_until}</td>
				 				</tr>
			 				</table>
			 		</div>
			 	`
		},
		createWallet: (info, localInfo) => {
			 var stopStartBtn = (info.status) ? templates.stopBtn(localInfo.name) : templates.startBtn(localInfo.name);
			 var walletInfo = info.status ? templates.walletInfo(info) : '';
			 return `<div class="row" id="walletInf" data-name="${localInfo.name}">
			 			<div class="col-md-3 col-sm-12 walletInfo text-center">
			 				<img src="${localInfo.logo}" class="walletImage" /><br>
			 				${stopStartBtn}</br>
			 				<button class="walletBtn" id="startGuiBtn" data-name="${name}">Start GUI</button> </br>
			 				<button id="encryptButton" class="walletBtn" data-name = "${localInfo.name}">Encrypt</button></br>
			 				<button id="downloadBackupBtn" class="walletBtn" data-name = "${localInfo.name}">Backup</button></br>
			 				<button type="file" id="restoreButton" class="walletBtn" data-name = "${localInfo.name}"> Restore</button></br>
			 				<input type="file" id="restoreBackup" accept=".dat" data-name="${localInfo.name}">
			 				<button class="walletBtn" id="unlockWalletBtn" data-name="${localInfo.name}">Unlock</button> </br>
			 			</div>
						${walletInfo}
			 		</div>`;
			},
		diplsayWalletInfOnPage: walletName => {
			walletOb.wallet(walletName).getInfo()
					.then(info => {console.log(info); return templates.createWallet(info,walletOb.wallet(walletName))})
					.then(result => walletOb.walletInfoDiv.html('').append(result))
		}
	}


var events = {
	walletInfoDivBindEvent: (el, type, callback) => {
		walletOb.walletInfoDiv.delegate(el,type,callback)
	},

	walletImageClick: () => {
		templates.diplsayWalletInfOnPage(event.target.dataset.name);
	},
	stopWallet: () => {
		var button = event.target
		button.disabled = true;
		walletOb.wallet(button.dataset.name).stop()
		.then(data => templates.diplsayWalletInfOnPage(button.dataset.name))
		.catch(() => button.disabled = false)	
	},
	startWallet: () => {
		var button = event.target
		button.disabled = true;
		walletOb.wallet(button.dataset.name).start()
		.then(data => templates.diplsayWalletInfOnPage(button.dataset.name))
		.catch(() => button.disabled = false)
	},

	encryptWallet: () => {
		var encryptionPassword = $('#encryptionPassword').val()
		var walletName = $('#encryptWalletName').val()
		console.log(encryptionPassword, walletName)
		if(encryptionPassword !== null && encryptionPassword !== ""){
			var data = {password: encryptionPassword};
			//data.append("password",encryptionPassword);
			api.wallet.encryptWallet(walletName, data)
			.then(response => console.log(response))
			.catch(response => console.log(response))
		}
	},

	restoreWallet: () => {
		walletName = event.target.dataset.name;	
		var backup = event.target.files[0]
		var data = new FormData()
		data.append("backup", backup)
		api.wallet.restoreWallet(walletName, data)
	},

	downloadBackup: () => {	
		api.wallet.downloadBackup(event.target.dataset.name)			
	},

	startGui: () => {	
		api.wallet.startGui(event.target.dataset.name)			
	},

	unlockWallet: () => {
		$('#unlockWalletPassword').val('')
		$('#unlockWalletTime').val('0')
		$('#unlockWalletCoins').prop('checked', false)		
		$('#unlockWalletName').val(event.target.dataset.name)
		$('#unlockWalletModal').modal('show') 

	},
	unlockWalletModal: () =>{
		console.log('unlocking')
		var walletName  = $('#unlockWalletName').val()
		var pass = $('#unlockWalletPassword').val()
		var time = $('#unlockWalletTime').val()
		var sendReceiveCoint = $('#unlockWalletCoins').is(":checked");

		var data = new FormData()
		data.append('password', pass)
		data.append('time', time)
		data.append('sendReceiveCoint', sendReceiveCoint)

		api.wallet.unlockWallet(walletName,data)
		
	}
}

var walletOb;
	var init = async () => {
		walletOb = walletFactory()
		wifi.scanButton.on('click', () => wifi.scann())
		wifi.connectButton.on('click', () => 
			wifi.connect(wifi.selectedWifi())
			.then((response) => {
				wifi.wifiList.hide()
				wifi.clearPasswordField()
			})
		)


		walletOb.fetchWallets()
		.then(() => {
			//Delegate event to all wallets
			let ev = events.walletInfoDivBindEvent;
			walletOb.walletsDiv.delegate(".walletImage",'click', () => events.walletImageClick())
			ev('#stopWalletBtn', 'click', () => events.stopWallet())
			ev('#startWalletBtn', 'click', () => events.startWallet())
			//ev('#encryptBtn', 'click', () => events.encryptWallet())
			$('#encryptBtn').on('click', () => events.encryptWallet())
			ev('#encryptButton', 'click', () => {
				$('#encryptWalletModal').modal('show')
				$('#encryptWalletName').val(event.target.dataset.name)
			})
			
			ev('#backupButton', 'click', () => events.backupWallet())
			ev('#restoreButton', 'click', () => $('#restoreBackup').click())
			ev('#restoreBackup', 'change', () => events.restoreWallet())
			ev('#downloadBackupBtn', 'click', () => events.downloadBackup())
			ev('#startGuiBtn', 'click', () => events.startGui())
			ev('#unlockWalletBtn', 'click', () => events.unlockWallet())
			$('#unlockWalletBtnModal').on('click', () => events.unlockWalletModal())
		})
		
	}
	init()

});