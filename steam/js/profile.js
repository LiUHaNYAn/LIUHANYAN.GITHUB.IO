//<script>

/* returns a jquery deferred object, .done() means an invite was sent (or attempted), .fail() indicates they dismissed the modal */
function PresentGroupInviteOptions( rgFriendsToInvite )
{
	// this deferred will succeed if an invite is succesfully sent, fail if the user dismisses the modal or the invite AJAX fails
	var deferred = new jQuery.Deferred();

	var Modal = ShowDialog( '邀请加入您的组', '<div class="group_invite_throbber"><img src="https://community.cloudflare.steamstatic.com/public/images/login/throbber.gif"></div>' );
	var $ListElement = $J('<div/>', {'class': 'newmodal_content_innerbg'} );

	var bBulkFriendInvite = false;
	var steamIDInvitee = g_rgProfileData['steamid'];
	var strProfileURL = g_rgProfileData['url'];

	// see if this is a request to bulk invite a group of friends
	if ( rgFriendsToInvite && rgFriendsToInvite instanceof Array )
	{
		if ( rgFriendsToInvite.length == 1 )
		{
			steamIDInvitee = rgFriendsToInvite[0];
			strProfileURL = 'https://steamcommunity.com/profiles/' + steamIDInvitee + '/';
		}
		else
		{
			// true bulk invite
			steamIDInvitee = rgFriendsToInvite;
			bBulkFriendInvite = true;
		}
	}

	// if the modal is dismissed , we'll cancel the deferred object.  We capture this in a closure so that we can dismiss the modal without affecting
	//	the deferred object if the user actually picks something (in which case the deferred object will be the success of the AJAX invite action)
	var fnOnModalDismiss = function() { deferred.reject() };

	$J.get( strProfileURL + 'ajaxgroupinvite?new_profile=1' + ( bBulkFriendInvite ? '&bulk=1' : '' ), function( html ) {
		Modal.GetContent().find( '.newmodal_content').html('');	// erase the throbber
		Modal.GetContent().find( '.newmodal_content').append( $ListElement );
		$ListElement.html( html );
		Modal.AdjustSizing();
		$ListElement.children( '.group_list_results' ).children().each( function () {
			var groupid = this.getAttribute( 'data-groupid' );
			if ( groupid )
			{
				$J(this).click( function() {
					fnOnModalDismiss = function () {;};	// don't resolve the deferred on modal dismiss anymore, user has picked something
					InviteUserToGroup( Modal, groupid, steamIDInvitee)
					.done( function() { deferred.resolve(); } )
					.fail( function() { deferred.reject(); } );
				} );
			}
		});
	});

	Modal.done( function() {fnOnModalDismiss();} );

	return deferred.promise();
}

function InviteUserToGroup( Modal, groupID, steamIDInvitee )
{
	var params = {
		json: 1,
		type: 'groupInvite',
		group: groupID,
		sessionID: g_sessionID
	};

	if ( !steamIDInvitee.length )
	{
		ShowAlertDialog( '错误', '您未选择任何好友。' );
		return;
	}

	if ( steamIDInvitee instanceof Array )
		params.invitee_list = V_ToJSON( steamIDInvitee );
	else
		params.invitee = steamIDInvitee;

	return $J.ajax( { url: 'https://steamcommunity.com/actions/GroupInvite',
		data: params,
		type: 'POST'
	} ).done( function( data ) {
		Modal && Modal.Dismiss();

		var strMessage = '邀请已发出！';
		if ( steamIDInvitee instanceof Array && steamIDInvitee.length > 1 )
			strMessage = '邀请已发送！';

		ShowAlertDialog( '邀请加入您的组', strMessage );
	}).fail( function( data ) {
		Modal && Modal.Dismiss();

		var rgResults = data.responseJSON;

		var strModalTitle = '群组邀请失败';
        var strAccountListModal = '<div class="ctnClanInviteErrors">';
        strAccountListModal += rgResults.results ? rgResults.results : '处理您的请求时出现错误。请再试。';
		if ( rgResults.rgAccounts )
		{
			strAccountListModal += '<div class="ctnClanInviteErrors"><table class="clanInviteErrorTable" ><thead><tr><th class="inviteTablePersona" >已受邀玩家</th><th class="inviteTableError">错误</th></tr></thead><tbody>';
			var cAccounts = 0;
			$J.each( rgResults.rgAccounts, function( accountid, rgError ){
				strAccountListModal += '<tr>';
				strAccountListModal += '<td class="inviteTablePersona ellipsis">' + rgError.persona + '</td>';
				strAccountListModal += '<td class="inviteTableError">' + rgError.strError + "</td>";
				strAccountListModal += '</tr>';

                if ( typeof SelectNone != 'undefined' )
                {
	                SelectNone();
	                $J( '#fr_' + accountid ).addClass( 'groupInviteFailed' );
                }

				cAccounts++;
			} );
			strAccountListModal += '</tbody></table>';

            if ( cAccounts > 1 )
	            strModalTitle = '群组邀请失败';

		}
		strAccountListModal +='</div>';
		ShowAlertDialog( strModalTitle, strAccountListModal );
	});
}

function RemoveFriend()
{
	var steamid = g_rgProfileData['steamid'];
	var strPersonaName = g_rgProfileData['personaname'];

	ShowConfirmDialog( '移除好友',
		'您确定要把 %s 从您的好友列表中移除吗？'.replace( /%s/, strPersonaName ),
		'移除好友'
	).done( function() {
		$J.post(
			'https://steamcommunity.com/actions/RemoveFriendAjax',
			{sessionID: g_sessionID, steamid: steamid }
		).done( function() {
			ShowAlertDialog( '移除好友',
				'%s 已从您的好友列表中移除。'.replace( /%s/, strPersonaName )
			).done( function() {
				// reload the page when they click OK, so we update friend state
				window.location.reload();
			} );
		} ).fail( function() {
			ShowAlertDialog( '移除好友',
				'处理您的请求时出现错误。请再试。'
			);
		} );
	} );
}

function CancelInvite()
{
	var steamid = g_rgProfileData['steamid'];
	var strPersonaName = g_rgProfileData['personaname'];

	ShowConfirmDialog( '取消邀请',
	'您确定您想要取消该好友邀请？<br>您将无法立即向该玩家发送另一份邀请。如果您在生活中认识他们，您可以随时给他们发送<a href="https://steamcommunity.com/my/friends/add" target="_blank" rel="noreferrer">好友邀请链接</a>。',
	'取消邀请'
	).done( function() {
		$J.post(
			'https://steamcommunity.com/actions/RemoveFriendAjax',
			{sessionID: g_sessionID, steamid: steamid }
		).done( function() {
			ShowAlertDialog( '取消邀请',
				'您对 %s 的邀请已经取消。'.replace( /%s/, strPersonaName )
		).done( function() {
				// reload the page when they click OK, so we update friend state
				window.location.reload();
			} );
		} ).fail( function() {
			ShowAlertDialog( '取消邀请',
				'处理您的请求时出现错误。请再试。'
		);
		} );
	} );
}

// also used for accepting friend invites
function AddFriend( bRespondingToInvite, steamid_friend, strPersonaName_friend )
{
	var steamid = steamid_friend ? steamid_friend : g_rgProfileData['steamid'];
	var strPersonaName = strPersonaName_friend ? strPersonaName_friend : g_rgProfileData['personaname'];

	$J.post(
		'https://steamcommunity.com/actions/AddFriendAjax',
		{sessionID: g_sessionID, steamid: steamid, accept_invite: bRespondingToInvite ? 1 : 0 }
	).done( function() {
		if ( !bRespondingToInvite )
		{
			ShowAlertDialog( '添加好友' + ' - ' + strPersonaName,
				'好友邀请已发出。对方将在接受邀请后显示为您的好友。'
			).done( function() { window.location.reload(); } );
		}
		else
		{
			ShowAlertDialog( '接受好友请求',
				'已接受好友请求'
			).done( function() { window.location.reload(); } );
		}
	} ).fail( function( jqXHR  ) {

		var failedInvites = jqXHR.responseJSON['failed_invites_result'];

		if ( failedInvites === undefined )
		{
			ShowAlertDialog( '添加好友',
				'添加好友发生错误。请重试。'
			);
			return;
		}

		// defaults
		var strTitle = '添加好友';
		var strMessage = '添加好友发生错误。请重试。';

		switch ( failedInvites[0] )
		{
			case 25:
				strMessage = '无法邀请 %s。您的好友列表已满。';
				break;

			case 15:
				strMessage = '无法邀请 %s。对方的好友列表已满。';
				break;

			case 40:
				strMessage = '添加好友出错。您与此用户之间的通信已被屏蔽。';
				break;

			case 11:
				strMessage = '您将屏蔽与此用户的所有通信。在与此用户进行通信之前，您必须访问其 Steam 社区个人资料以取消屏蔽。';
				break;

			case 84:
				strMessage = '看来最近您发送的好友邀请过多。为防止滥发好友邀请，您需要等待一段时间，才能重新邀请更多好友。请注意，在此期间，其他玩家仍然可以将您加为好友。';
				break;

			case 24:
				strMessage = '您的帐户不符合使用该功能的要求。<a class="whiteLink" href="https://help.steampowered.com/zh-cn/wizard/HelpWithLimitedAccount" target="_blank" rel="noreferrer">访问 Steam 客服</a>了解更多信息。';
				break;

			default:
				// default text is above
				break;
		}

		strMessage = strMessage.replace( /%s/, strPersonaName );
		ShowAlertDialog( strTitle, strMessage );

	} );
}

// ignore an invite; do not block the inviter
function IgnoreFriendInvite( steamid_friend, strPersonaName_friend )
{
	var steamid = steamid_friend ? steamid_friend : g_rgProfileData['steamid'];
	var strPersonaName = strPersonaName_friend ? strPersonaName_friend : g_rgProfileData['personaname'];

	$J.post(
		'https://steamcommunity.com/actions/IgnoreFriendInviteAjax',
		{sessionID: g_sessionID, steamid: steamid }
	).done( function() {
		ShowAlertDialog( '忽略好友请求',
			'好友请求已忽略'
		).done( function() { window.location.reload(); } );
	} ).fail( function() {
		ShowAlertDialog( '忽略好友请求',
			'忽略好友请求时发生错误。请重试。'
		);
	} );
}

// block a user, with confirmation
function ConfirmBlock()
{
	var steamid = g_rgProfileData['steamid'];
	var strPersonaName = g_rgProfileData['personaname'];

	ShowConfirmDialog( '屏蔽所有通信',
		'您将会屏蔽与 %s 的所有通信。'.replace( /%s/, strPersonaName ),
		'确定'
	).done( function() {
			$J.post(
				'https://steamcommunity.com/actions/BlockUserAjax',
				{sessionID: g_sessionID, steamid: steamid, block: 1 }
			).done( function() {
				ShowAlertDialog( '屏蔽所有通信',
					'您已屏蔽与此玩家的所有通信。'
				).done( function() {
					location.reload();
				} );
			} ).fail( function() {
				ShowAlertDialog( '屏蔽所有通信',
					'处理您的请求时出现错误。请再试。'
				);
			} );
		} );
}

// unblock a user, with confirmation
function ConfirmUnblock()
{
	var steamid = g_rgProfileData['steamid'];
	var strPersonaName = g_rgProfileData['personaname'];

	ShowConfirmDialog( '解除屏蔽所有通信',
	'您即将取消与 %s 的通信屏蔽。'.replace( /%s/, strPersonaName ),
	'是的，取消屏蔽他们'
).done( function() {
	$J.post(
		'https://steamcommunity.com/actions/BlockUserAjax',
		{sessionID: g_sessionID, steamid: steamid, block: 0 }
	).done( function() {
		ShowAlertDialog( '解除屏蔽所有通信',
			'您已屏蔽与此玩家的所有通信。'
		).done( function() {
			location.reload();
		} );
	} ).fail( function() {
		ShowAlertDialog( '解除屏蔽所有通信',
			'处理您的请求时出现错误。请再试。'
		);
	} );
} );
}

function InitProfileSummary( strSummary )
{
	var $Summary = $J( '.profile_summary' );
	var $SummaryFooter = $J( '.profile_summary_footer' );

	if ( $Summary[0].scrollHeight <= 76 )
	{
		$Summary.addClass( 'noexpand' );
		$SummaryFooter.hide();
	}
	else
	{
		var $ModalSummary = $J('<div/>', {'class': 'profile_summary_modal'}).html( strSummary );
		$SummaryFooter.find( 'span' ).click( function() {
			var Modal = ShowDialog( '信息', $ModalSummary );
			window.setTimeout( function() { Modal.AdjustSizing(); }, 1 );
		} );
	}

}

function ShowFriendsInCommon( unAccountIDTarget )
{
	ShowPlayerList( '共同的好友', 'friendsincommon', unAccountIDTarget );
}

function ShowFriendsInGroup( unClanIDTarget )
{
	ShowPlayerList( '组中的好友', 'friendsingroup', unClanIDTarget );
}

function ShowPlayerList( title, type, unAccountIDTarget, rgAccountIDs )
{
	var Modal = ShowAlertDialog( title, '<div class="group_invite_throbber"><img src="https://community.cloudflare.steamstatic.com/public/images/login/throbber.gif"></div>' );
	var $ListElement = $J('<div/>', {'class': 'player_list_ctn'} );
	var $Buttons = Modal.GetContent().find('.newmodal_buttons').detach();

	Modal.GetContent().css( 'min-width', 268 );

	var rgParams = {};
	if ( type )
		rgParams['type'] = type;
	if ( unAccountIDTarget )
		rgParams['target'] = unAccountIDTarget;
	if ( rgAccountIDs )
		rgParams['accountids'] = rgAccountIDs.join( ',' );

	$J.get( 'https://steamcommunity.com/actions/PlayerList/', rgParams, function( html ) {

		$ListElement.html( html );

		var $Content = Modal.GetContent().find( '.newmodal_content');
		$Content.html(''); // erase the throbber
		$Content.append( $ListElement );
		$Content.append( $Buttons );

		Modal.AdjustSizing();
		$ListElement.append();
	});
}

function ToggleManageFriends()
{
	if ( $J('#manage_friends_actions_ctn').is( ':hidden' ) )
	{
		$J('#manage_friends_btn').find( '.btn_details_arrow').removeClass( 'down').addClass( 'up' );
		$J('#manage_friends_actions_ctn').slideDown( 'fast' );
		$J('div.manage_friend_checkbox').show();
		$J('a.friendBlockLinkOverlay' ).on( 'click.manage_friends', function( event ) {
			if ( !event.which || event.which == 1 )
			{
				event.preventDefault();
				$J(this ).siblings('.manage_friend_checkbox' ).find('input[type=checkbox]' ).prop( 'checked', function( i, v ) { return !v; } );
			}
		});
	}
	else
	{
		$J('#manage_friends_btn').find( '.btn_details_arrow').removeClass( 'up').addClass( 'down' );
		$J('#manage_friends_actions_ctn').slideUp( 'fast' );
		$J('div.manage_friend_checkbox').hide();
		$J('a.friendBlockLinkOverlay' ).off( 'click.manage_friends' );
	}
}

function ManageFriendsInviteToGroup( $Form, groupid )
{
	$Form.find('input[type="checkbox"]');
	var rgFriendSteamIDs = [];
	$Form.find( 'input[type=checkbox]' ).each( function() {
		if ( this.checked )
			rgFriendSteamIDs.push( $J(this).attr( 'data-steamid' ) );
	} );
	if ( rgFriendSteamIDs.length > 0 )
	{
		if ( groupid )
		{
			// specific group
			InviteUserToGroup( null /* no modal window */, groupid, rgFriendSteamIDs ).done( function() {
				$Form.find('input[type=checkbox]').prop( 'checked', false );
			});
		}
		else
		{
			// ask the user which group to invite to
			PresentGroupInviteOptions( rgFriendSteamIDs).done( function() {
				$Form.find('input[type=checkbox]').prop( 'checked', false );
			});
		}
	}
	else
	{
		ShowAlertDialog( '邀请加入您的组', '您尚未选择任何好友。' );
	}
}

function ManageFriendsExecuteBulkAction( $Form, strActionName )
{
	if ( $Form.find('input[type=checkbox]:checked').length == 0 )
	{
		ShowAlertDialog( '', '您尚未选择任何好友。' );
		return;
	}

	$Form.find('input[name=action]').val( strActionName );
	$Form.submit();
}

function ManageFriendsConfirmBulkAction( $Form, strActionName, strTitle, strSingluarDescription, strPluralDescription )
{
	var cFriendsSelected = $Form.find('input[type=checkbox]:checked').length;
	if ( cFriendsSelected == 0 )
	{
		ShowAlertDialog( strTitle, '您尚未选择任何好友。' );
		return;
	}

	var strDescription = strSingluarDescription;
	if ( cFriendsSelected != 1 )
		strDescription = strPluralDescription.replace( /%s/, cFriendsSelected );

	ShowConfirmDialog( strTitle, strDescription).done( function() {
		ManageFriendsExecuteBulkAction( $Form, strActionName );
	});
}

function ManageFriendsBlock( $Form )
{
	ManageFriendsConfirmBulkAction( $Form, 'ignore', '屏蔽',
		'是否确定要屏蔽此好友？' + ' ' + '您将不能发送消息给该玩家，也不能接收该玩家的消息或该玩家的邀请。',
		'是否确定要屏蔽这 %s 位好友？' + ' ' + '您将不能发送消息给该玩家，也不能接收该玩家的消息或该玩家的邀请。');
}

function ManageFriendsRemove( $Form )
{
	ManageFriendsConfirmBulkAction( $Form, 'remove', '移除好友',
		'是否确定要删除此好友？' + ' ' + '该玩家将不会再出现在好友列表中，也无法再与其联系。',
		'是否确定要删除这 %s 位好友？' + ' ' + '这些玩家将不会再出现在好友列表中，也无法再与其联系。');
}

function ManageFollowingRemove( $Form )
{
	ManageFriendsConfirmBulkAction( $Form, 'removefollowing', '是否要从您的关注列表中移除？',
		'您确定要停止关注这个人吗？',
		'您确定要停止关注这 %s 个人吗？');
}

function ManageFriendsAddFriends( $Form )
{
	ManageFriendsConfirmBulkAction( $Form, 'addfriend', '添加到好友列表',
		'您确定要向选中的玩家发送好友邀请吗？ ',
		'您确定要向选中的玩家发送好友邀请吗？ '	);
}



var AliasesLoaded = false;
function ShowAliasPopup(e)
{
	ShowMenu( e, 'NamePopup', 'left' );

	if( AliasesLoaded )
		return true;

	var aliasContainer = $( 'NamePopupAliases' );

	var throbber = document.createElement( 'img' );
	throbber.src = 'https://community.cloudflare.steamstatic.com/public/images/login/throbber.gif';
	aliasContainer.appendChild( throbber );

	new Ajax.Request( g_rgProfileData['url'] + 'ajaxaliases/', {
		method: 'post',
		parameters: { },
		onSuccess: function( transport ) {

			var Aliases = transport.responseJSON;

			if( !aliasContainer )
				return;

			aliasContainer.update('');

			if( !Aliases || Aliases.length == 0 )
				Aliases.push( {newname: "此用户无已知曾用名"} );
			else
				$( 'NamePopupClearAliases' ).show();

			for( var x=0; x<Aliases.length; x++ )
			{
				var c = Aliases[x];

				var curSpan = document.createElement( 'p' );
				var curATN = document.createTextNode( c['newname'] );
				curSpan.appendChild( curATN );
				aliasContainer.appendChild( curSpan );
			}

			AliasesLoaded = true;
		},
		onFailure: function( transport ) { alert( 'Please try again later' ); }
	} );
}

function ShowClearAliasDialog()
{
	ShowConfirmDialog( '清除曾用名纪录', '您确定要清除您的个人资料名称历史记录吗？这会让最近曾和您一起玩游戏的用户更难找到您，而且会让您好友列表中的用户难以对您进行识别。' )
		.done( function() {
			$J.ajax( {
				url: g_rgProfileData['url'] + 'ajaxclearaliashistory/',
				data: { sessionid: g_sessionID },
				type: 'POST',
				dataType: 'json'
			}).done( function( data ) {
				if ( data.success != 1 )
				{
					ShowAlertDialog( '', '处理您的请求时出现错误。请再试。' );
				}
				else
				{
					location.reload();
				}
			}).fail( function( data ) {
				ShowAlertDialog( '', '处理您的请求时出现错误。请再试。' );
			})
		} );
}

function IsValidNickname( str )
{
	return str.length == 0 || str.strip().length > 2;
}

function ShowNicknameModal( )
{
	// Show the dialogue
	ShowPromptDialog( "\u6dfb\u52a0\u6635\u79f0", "\u4e3a\u6b64\u73a9\u5bb6\u6dfb\u52a0\u6c38\u4e45\u6635\u79f0\u4ee5\u8bb0\u5f55\u4ed6\u4eec\u7684\u8eab\u4efd\u3002", "\u6dfb\u52a0\u6635\u79f0", "\u53d6\u6d88" )
		.done( function( nickname, other ) {
			// User clicked 'OK', so we have a value; need to send it to the server
			$J.ajax( { url: g_rgProfileData['url'] + "ajaxsetnickname/",
				data: { nickname: nickname, sessionid: g_sessionID },
				type: 'POST',
				dataType: 'json'
			} ).done( function( data ) {
				// Got request result back, show it on the page
				if(data.nickname != undefined && data.nickname.length > 0)
				{
					$target = $J('.persona_name .nickname');
					// Add the nickname element if we don't already have one.
					if( $target.length == 0 )
						$target = $J('<span class="nickname"></span>').insertBefore( '.namehistory_link' );

					$target.text( "(" + data.nickname + ") " );
					$target.show();
				} else
					$J('.persona_name .nickname').hide();

			}).fail( function( data ) {
				ShowAlertDialog( '', data.results ? data.results : '处理您的请求时出现错误。请再试。' );
			});

		}
	);
}

function SetFollowing( bFollowing, fnOnSuccess )
{
	var url = bFollowing ? g_rgProfileData['url'] + "followuser/" : g_rgProfileData['url'] + "unfollowuser/";
	$J.ajax( { url: url,
		data: { sessionid: g_sessionID },
		type: 'POST',
		dataType: 'json'
	} ).done( function( data ) {
		fnOnSuccess( bFollowing );
	}).fail( function( data ) {
		ShowAlertDialog( '', data.results ? data.results : '处理您的请求时出现错误。请再试。' );
	});
}


function ShowFriendSelect( title, fnOnSelect )
{
	var Modal = ShowAlertDialog( title, '<div class="group_invite_throbber"><img src="https://community.cloudflare.steamstatic.com/public/images/login/throbber.gif"></div>', '取消' );
	var $ListElement = $J('<div/>', {'class': 'player_list_ctn'} );
	var $Buttons = Modal.GetContent().find('.newmodal_buttons').detach();

	Modal.GetContent().css( 'min-width', 268 );

	var rgParams = {type: 'friends'};

	$J.get( 'https://steamcommunity.com/actions/PlayerList/', rgParams, function( html ) {

		$ListElement.html( html );

		$ListElement.find( 'a' ).remove();
		$ListElement.find( '[data-miniprofile]').each( function() {
			var $El = $J(this);
			$El.click( function() {  Modal.Dismiss(); fnOnSelect( $El.data('miniprofile') ); } );
		} );

		var $Content = Modal.GetContent().find( '.newmodal_content');
		$Content.html(''); // erase the throbber
		$Content.append( $ListElement );
		$Content.append( $Buttons );

		Modal.AdjustSizing();
	});
}

function StartTradeOffer( unAccountID, rgParams )
{
	var params = rgParams || {};
	params['partner'] = unAccountID;
	ShowTradeOffer( 'new', params );
}

function CancelTradeOffer( tradeOfferID )
{
	ShowConfirmDialog(
		'取消交易报价',
		'您确定要取消此报价吗？',
		'是',
		'否'
	).done( function() {
		ActOnTradeOffer( tradeOfferID, 'cancel', '报价已取消', '取消交易报价' );
	} );
}

function DeclineTradeOffer( tradeOfferID )
{
	ShowConfirmDialog(
		'拒绝交易',
		'您确定要拒绝此报价吗？您也可以修改物品并发回一个还价。',
		'拒绝交易',
		null,
		'进行还价'
	).done( function( strButton ) {
		if ( strButton == 'OK' )
			ActOnTradeOffer( tradeOfferID, 'decline', '交易已拒绝', '拒绝交易' );
		else
			ShowTradeOffer( tradeOfferID, {counteroffer: 1} );
	} );
}

function ActOnTradeOffer( tradeOfferID, strAction, strCompletedBanner, strActionDisplayName )
{
	var $TradeOffer = $J('#tradeofferid_' + tradeOfferID);
	$TradeOffer.find( '.tradeoffer_footer_actions').hide();

	return $J.ajax( {
		url: 'https://steamcommunity.com/tradeoffer/' + tradeOfferID + '/' + strAction,
		data: { sessionid: g_sessionID },
		type: 'POST',
		crossDomain: true,
		xhrFields: { withCredentials: true }
	}).done( function( data ) {
		AddTradeOfferBanner( tradeOfferID, strCompletedBanner, false );

		RefreshNotificationArea();
	}).fail( function() {
		ShowAlertDialog( strActionDisplayName, '修改报价时出现了一个错误。请稍后再试。' );
		$TradeOffer.find( '.tradeoffer_footer_actions').show();
	});
}

function AddTradeOfferBanner( tradeOfferID, strCompletedBanner, bAccepted )
{
	var $TradeOffer = $J('#tradeofferid_' + tradeOfferID);
	$TradeOffer.find( '.tradeoffer_footer_actions').hide();
	$TradeOffer.find( '.link_overlay' ).hide();
	$TradeOffer.find( '.tradeoffer_items_ctn').removeClass( 'active' ).addClass( 'inactive' );

	var $Banner = $J('<div/>', {'class': 'tradeoffer_items_banner' } );
	if ( bAccepted )
		$Banner.addClass( 'accepted' );

	$Banner.text( strCompletedBanner );
	$TradeOffer.find( '.tradeoffer_items_rule').replaceWith( $Banner );
}

function UpdateProfileTextContentCheckResult( steamID, ban )
{
	var dialog = ShowConfirmDialog( '更新自动文本内容检查结果吗？', !ban ? '您确定要重置此用户个人资料文本的自动文本内容检查结果吗？此操作无法撤销。' : '您确定要将此用户的个人资料文本标记为包含有害内容吗？此操作无法撤销。' );
	dialog.done( function() {
		$J.post( 'https://steamcommunity.com/moderation/ajaxupdateprofiletextcontentcheckresult/', { sessionid: g_sessionID, steamid: steamID, ban: ban ? 1 : 0 } )
		.done( function( data ) {
			top.location.reload();
		} );
	});
}

function UpdateProfileShowcaseContentCheckResult( steamID, type, slot, purchaseid, ban )
{
	var dialog = ShowConfirmDialog( '更新自动文本内容检查结果吗？', !ban ? '您确定要重置此用户个人资料展柜的自动文本内容检查结果吗？此操作无法撤销。' : '您确定要将此用户的个人资料展柜标记为包含有害内容吗？此操作无法撤销。' );
	dialog.done( function() {
		$J.post( 'https://steamcommunity.com/moderation/ajaxupdateprofileshowcasecontentcheckresult/', { sessionid: g_sessionID, steamid: steamID, type: type, slot: slot, purchaseid: purchaseid, ban: ban ? 1 : 0 } )
		.done( function( data ) {
			top.location.reload();
		} );
	});
}

function AddProfileAward( bLoggedIn, loginURL, steamID, selectedAward )
{
	if ( !bLoggedIn )
	{
		var dialog = ShowConfirmDialog( '错误', '您必须登录后才能执行该操作。', '登录' );
		dialog.done( function() {
			top.location.href = loginURL;
		} );
	}
	else
	{
		function callbackFunc( id, award )
		{
			top.location.reload();
		};
		fnLoyalty_ShowAwardModal( steamID, 3, callbackFunc, undefined, selectedAward );
	}
}

