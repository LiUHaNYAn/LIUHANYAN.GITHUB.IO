
var g_elActiveSticker = false;
var g_elStickerContainer = null;
var g_rgDragState = false;
var g_nBaseScaleFactor = 1.0;

var CStickerManager = function( elContainer, bEditMode ){
	this.unWidthActual = 940;
	this.fScaleFactor =  this.unWidthActual / 2100; // Sprite scale
	this.elContainer = elContainer;
	this.rgOwnedStickers = [];
	this.bEditMode = bEditMode || false;
	this.rgNewStickersCount = {};

	if( this.bEditMode )
		this.ShowEditHandles();


	this.rgStickerDefinitions = g_rgStickerDefs;

	// Build some maps
	for( var key in this.rgStickerDefinitions )
	{
		this.rgStickerToIdMap.push( key );
		if( this.rgSceneToIdMap.indexOf( this.rgStickerDefinitions[key].texture ) === -1 )
			this.rgSceneToIdMap.push(this.rgStickerDefinitions[key].texture);

	}

	// Make horrible assumptions about filenames
	for( var i=0; i<this.rgSceneToIdMap.length; i++ )
	{

		CStickerManager.prototype.rgStickerTextures[this.rgSceneToIdMap[i]] = 'https://community.cloudflare.steamstatic.com/public/images/promo/summer2017/stickers/'+this.rgSceneToIdMap[i]+'_sprites.png?v=22';
		CStickerManager.prototype.rgBackgroundTextures[this.rgSceneToIdMap[i]] = 'https://community.cloudflare.steamstatic.com/public/images/promo/summer2017/stickers/'+this.rgSceneToIdMap[i]+'.jpg?v=22';
	}


	window.addEventListener('resize', this.HandleResize.bind(this));
	this.HandleResize();

}

CStickerManager.prototype.HandleResize = function() {
	// BUCKLE UP
	var fScaleFactor = this.elContainer.parentNode.clientWidth / this.unWidthActual;

	this.elContainer.style.transform = "scale( "+fScaleFactor+", "+fScaleFactor+" )";

	this.fLocalScale = fScaleFactor;

	this.elContainer.style.width = this.unWidthActual + "px";

	var rgBackgrounds = this.elContainer.getElementsByClassName('sticker_background');
	rgBackgrounds[0].style.width = this.unWidthActual + "px";

	// Now do the logo animation

	if ( document.getElementById('logo_anim') )
	{
		document.getElementById('logo_anim').style.transform = "scale( "+fScaleFactor+", "+fScaleFactor+" )";
	}
}

CStickerManager.prototype.rgStickerTextures = {

}

CStickerManager.prototype.rgBackgroundTextures = {

}

CStickerManager.prototype.rgStickerToIdMap = [

];

CStickerManager.prototype.rgSceneToIdMap = [

];

CStickerManager.prototype.rgSceneData = {

};

CStickerManager.prototype.rgStickerDefinitions = {
};


CStickerManager.prototype.RegisterSprites = function(strTexture, strMap, strPlacementMap)
{
	return;
	var rgLines = strMap.split("\n");
	for( var i=0; i<rgLines.length; i++ )
	{
		var rgv = rgLines[i].trim().split(',');
		if( rgv.length != 5 )
			continue;

		this.rgStickerDefinitions[rgv[0]] = {
			texture: strTexture,
			name: rgv[0],
			x: rgv[1],
			y: rgv[2],
			w: rgv[3],
			h: rgv[4]
		}
	}

	var rgLines = strPlacementMap.split("\n");
	for( var i=0; i<rgLines.length; i++ )
	{
		var rgv = rgLines[i].trim().split(',');
		if( rgv.length != 3 && rgv.length != 4 )
			continue;

		this.rgStickerDefinitions[rgv[0]].dx = rgv[1];
		this.rgStickerDefinitions[rgv[0]].dy = rgv[2];
		this.rgStickerDefinitions[rgv[0]].dz = rgv[3] || false;


	}
}

CStickerManager.prototype.AddSticker = function( nStickerId )
{
	// Do we have this sticker in the scene already??
	if( this.BSceneHasSticker( nStickerId ) )
		return;

	var rgData = this.GetSceneData();
	if( rgData.length > 50 )
	{
		ShowAlertDialog("\u592a\u591a\u8d34\u7eb8\uff01", "\u54ce\u5440\uff01\u60a8\u60f3\u5728\u8fd9\u9875\u653e\u5165\u8d85\u8fc7 50 \u4e2a\u8d34\u7eb8\u3002\u5982\u679c\u60a8\u60f3\u6dfb\u52a0\u66f4\u591a\uff0c\u9700\u8981\u5148\u6495\u6389\u51e0\u4e2a\u624d\u884c\u3002");
		return;
	}

	var sticker = this.rgStickerDefinitions[nStickerId];
	if( sticker.texture == this.strScene )
	{
		this.CreateSticker( nStickerId,
			sticker.dx * this.fScaleFactor,
			sticker.dy * this.fScaleFactor,
			1.0,
			1.0,
			0,
			sticker.z
		);
	}
	else
		this.CreateSticker( nStickerId, 10, 10, 1.0, 1.0, 0 );

	if( !this.BSceneUnlocked(this.strScene) && this.BSceneCanBeUnlocked( this.strScene ) )
	{
		this.UnlockScene( this.strScene );
	}
}

//CStickerManager.prototype.Set

CStickerManager.prototype.PopulateStickerList = function()
{
	// Sticker list
	var unMaxWidth = 140; // @todo don't hard code this
	var unMaxHeight = 100; // @todo don't hard code this either

	var elTarget = document.getElementById('sticker_selector');

	if( !elTarget )
		return;
	while( elTarget.firstChild )
		elTarget.removeChild( elTarget.firstChild );

	// Do we have a sticker pack? If so show that first
	if( this.unStickerPacks > 0 )
	{
		var elPack = document.createElement('div');
		elPack.classList.add('sticker_item');
		var elImage = document.createElement('img');
		elImage.src = "https://community.cloudflare.steamstatic.com/public/images/promo/summer2017/stickers_group.png";

		elPack.addEventListener('click', this.OpenPack.bind(this));

		elPack.appendChild(elImage);
		elTarget.appendChild(elPack);
	}


	for(var key in this.rgStickerDefinitions )
	{


		var stickerDef = this.rgStickerDefinitions[key];


		if( !this.BSceneUnlocked( this.strScene ) && stickerDef.texture != this.strScene )
			continue;

		var elSticker = this.CreateScaledSticker( key, unMaxWidth, unMaxHeight, !this.BOwnsSticker( key ) );



		if( this.BOwnsSticker( key ) )
			elSticker.addEventListener('click', this.AddSticker.bind(this, key ) );

		elTarget.appendChild(elSticker);
	}

}

CStickerManager.prototype.CreateScaledSticker = function( key, unMaxWidth, unMaxHeight, bFaded )
{
	var elImage = document.createElement('div');
	var stickerDef = this.rgStickerDefinitions[key];
	var texture = this.rgStickerTextures[ stickerDef.texture ];


	var elSticker = document.createElement('div');
	elSticker.classList.add('sticker_item');

	elImage.style.width = stickerDef.w + "px";
	elImage.style.height = stickerDef.h + "px";

	if( !bFaded  )
	{
		elImage.style.background = "url('"+texture+"') no-repeat -"+stickerDef.x+"px -"+stickerDef.y+"px";
	} else {
		elImage.style.webkitMask = "url('"+texture+"') no-repeat -"+stickerDef.x+"px -"+stickerDef.y+"px";// no-repeat -"+stickerDef.x+"px -"+stickerDef.y+"px";
		elImage.style.mask = "url('"+texture+"') no-repeat -"+stickerDef.x+"px -"+stickerDef.y+"px";// no-repeat -"+stickerDef.x+"px -"+stickerDef.y+"px";

		elImage.style.backgroundColor = '#9E9E9E';
	}



	var fScale = 1.0;

	if( stickerDef.w > unMaxWidth )
		fScale = unMaxWidth / stickerDef.w;

	if( stickerDef.h > unMaxHeight && unMaxHeight / stickerDef.h < fScale )
		fScale = unMaxHeight / stickerDef.h;


	elImage.style.transform = "scale( "+fScale+", "+fScale+" )";

	elSticker.appendChild( elImage );

	if( this.BOwnsSticker( key ) )
	{
		elSticker.addEventListener ( 'click', this.AddSticker.bind ( this, key ) );
		elSticker.draggable = true;
		elSticker.addEventListener ( 'dragstart', this.DragStart.bind ( this, key ) );
	}

	return elSticker;
}

CStickerManager.prototype.DragStart = function( key, event )
{

	event.dataTransfer.setData("key", key);
	event.dataTransfer.dropEffect = "copy";
	console.log(event);

}
CStickerManager.prototype.PopulateSelectors = function( )
{

	// Scene list
	var elTarget = document.getElementById('scene_selector');
	if( !elTarget )
		return;

	while( elTarget.firstChild )
		elTarget.removeChild( elTarget.firstChild );

	for( var key in this.rgBackgroundTextures )
	{

		var elContainer = document.createElement('div');
		var elImage = document.createElement('img');
		var texture = this.rgBackgroundTextures[ key ];

		elImage.src = texture;
		elContainer.classList.add('item');
		elContainer.id = key + "_select_icon";

		var nSceneId = this.rgSceneToIdMap.indexOf(key);

		elImage.addEventListener('click', this.SetScene.bind(this, nSceneId ) );

		// Text counts
		var rgCounts = this.GetStickerCounts( key );
		var elText = document.createElement('div');
		elText.textContent = "%2$s \u5f20\u8d34\u7eb8\u4e2d\u7684 %1$s \u5f20".replace(/%1\$s/,rgCounts[0]).replace(/%2\$s/,rgCounts[1])

		elContainer.appendChild(elImage);
		elContainer.appendChild(elText);


		// New counts
		var nNewStickers = this.rgNewStickersCount[key];
		if( nNewStickers )
		{
			var elNew = document.createElement('div');
			elNew.classList.add('new');
			elNew.textContent = nNewStickers;

			elContainer.appendChild(elNew);
		}

		if( this.rgOwnership.scenes[nSceneId] )
		{
			var elNew = document.createElement('div');
			elNew.classList.add('new');
			elNew.classList.add('unlocked');
			elNew.textContent = '✔';

			elContainer.appendChild(elNew);
		}


		if( nNewStickers )
			elTarget.insertBefore(elContainer, elTarget.firstChild);
		else
			elTarget.appendChild(elContainer);
	}

}

CStickerManager.prototype.GetStickerCounts = function( strScene )
{
	var unStickersTotal = 0;
	var unStickersOwned= 0;

	for( var key in this.rgStickerDefinitions )
	{
		var sticker = this.rgStickerDefinitions[ key ];
		if ( sticker.texture == strScene )
		{
			unStickersTotal++;
			if( this.BOwnsSticker( key ) )
				unStickersOwned++;
		}
	}
	return [ unStickersOwned, unStickersTotal ];
}

CStickerManager.prototype.BOwnsSticker = function( strStickerID )
{

	var nStickerId = this.rgStickerToIdMap.indexOf( strStickerID );
	return this.rgOwnership.stickers[ nStickerId ];
};

CStickerManager.prototype.BSceneUnlocked = function( strScene )
{
	var nSceneId = this.rgSceneToIdMap.indexOf(strScene);
	return this.rgOwnership.scenes[nSceneId];
}

CStickerManager.prototype.BSceneCanBeUnlocked = function( strScene )
{
	var rgSceneData = this.GetSceneData();

	for( var key in this.rgStickerDefinitions )
	{
		var sticker = this.rgStickerDefinitions[ key ];

		if ( sticker.texture == strScene )
		{
			var bFound = false;
			for( var i=0; i<rgSceneData.length; i++ )
			{
				if( rgSceneData[i].id == key )
				{
					bFound = true;
					break;
				}
			}
			if(!bFound)
				return false;
		}
	}
	return true;
}

CStickerManager.prototype.ResetScene = function()
{
	var rgStickers = this.elContainer.getElementsByClassName('sticker');
	for( var i=rgStickers.length - 1; i >= 0; i-- )
	{
		this.elContainer.removeChild( rgStickers[i] );
	}
}

CStickerManager.prototype.GetDefaultScene = function( strScene )
{
	var rgScene = [];

	for( var key in this.rgStickerDefinitions )
	{
		var sticker = this.rgStickerDefinitions[key];
		if( sticker.texture == strScene )
		{
			rgScene.push({
				id: key,
				x: sticker.dx * this.fScaleFactor,
				y: sticker.dy * this.fScaleFactor,
				sx: 1.0,
				sy: 1.0,
				r: 0,
				z: sticker.z
			});
		}
	}

	return rgScene;
}

CStickerManager.prototype.PreloadScene = function()
{
	// pass
}

CStickerManager.prototype.CreateSticker = function(id, x, y, sx, sy, r, z)
{
	var elSticker = document.createElement('div');
	var stickerDef = this.rgStickerDefinitions[id];
	var texture = this.rgStickerTextures[ stickerDef.texture ];

	elSticker.sticker = {
		id: id,
		x: x,
		y: y,
		sx: sx,
		sy: sy,
		r: r,
		z: z
	};

	elSticker.style.width = stickerDef.w + "px";
	elSticker.style.height = stickerDef.h + "px";
	elSticker.style.background = "url('"+texture+"') no-repeat -"+stickerDef.x+"px -"+stickerDef.y+"px";

	this.elContainer.appendChild(elSticker);

	//elSticker.addEventListener('click',  );
	var _this = this;
	elSticker.addEventListener('mousedown', function( event ){
		_this.SetStickerActive( elSticker );
		_this.StickerDragStart('x', 'y', false, event );
	});

	elSticker.addEventListener('touchstart', function( event ){
		_this.SetStickerActive( elSticker );
		_this.StickerDragStart('x', 'y', false, event );
	});

	this.UpdateStickerState( elSticker );

	elSticker.classList.add("sticker");




}

CStickerManager.prototype.UpdateStickerState = function( elSticker )
{
	elSticker.style.transform = "rotate("+elSticker.sticker.r+"deg) scale("+(elSticker.sticker.sx*this.fScaleFactor)+", "+(elSticker.sticker.sy*this.fScaleFactor)+")";

	var rect = elSticker.getBoundingClientRect();

	elSticker.style.left = elSticker.sticker.x+"px";
	elSticker.style.top = elSticker.sticker.y+"px";

	if( elSticker.sticker.z )
		elSticker.style.zIndex = elSticker.sticker.z;


}

CStickerManager.prototype.SetScene = function( nSceneId )
{

	// Save off old scene if we were on one
	if( this.strScene )
	{

		var nOldSceneId = this.rgSceneToIdMap.indexOf( this.strScene );
		this.rgSceneData[nOldSceneId] = this.GetSceneData();
	}

	this.strScene = this.rgSceneToIdMap[ nSceneId ];

	var rgBackgrounds = this.elContainer.getElementsByClassName('sticker_background');
	rgBackgrounds[0].src =this.rgBackgroundTextures[this.strScene];

	this.Render( this.rgSceneData[ nSceneId ] );

	// Update handles
	var rgMatches = document.querySelectorAll('.background_selection_container .item');

	for( var i=0; i < rgMatches.length; i++)
	{
		rgMatches[i].classList.remove('selected');
	}

	var elTarget  = document.getElementById(this.strScene  + "_select_icon");
	if( elTarget )
		elTarget.classList.add('selected');

	this.PopulateStickerList();

	if( this.bEditMode )
	{
		if ( !this.BSceneUnlocked ( this.strScene ) )
		{
			document.getElementById ( 'r_handle' ).style.display = "none";
			document.getElementById ( 's_handle' ).style.display = "none";
			document.getElementById ( 'feature_on_profile' ).style.display = "none";

		}
		else
		{
			document.getElementById ( 'r_handle' ).style.display = "block";
			document.getElementById ( 's_handle' ).style.display = "block";
			document.getElementById ( 'feature_on_profile' ).style.display = "inline-block";
		}
	}

};

CStickerManager.prototype.Render = function( rgSceneData )
{
	this.ResetScene();


	for( var i=0; i<rgSceneData.length; i++)
	{
		var sticker = rgSceneData[i];
		this.CreateSticker( sticker.id, sticker.x, sticker.y, sticker.sx, sticker.sy, sticker.r, sticker.z );
	}

	this.DeactivateSticker();
}

CStickerManager.prototype.MoveDot = function( dot, x, y )
{
	var dot = document.getElementById(dot);
	dot.style.top = y + "px";
	dot.style.left = x + "px";
}


CStickerManager.prototype.SetStickerActive = function( sticker )
{

	this.DeactivateSticker();

	this.elActiveSticker = sticker;
	sticker.classList.add('active');
	var elEditBox = document.getElementById('edit_box');
	elEditBox.classList.add('active');

	this.UpdateStickerHandles();

}

// Deselect any active sticker
CStickerManager.prototype.DeactivateSticker = function( )
{
	// Deactivate other sticker
	if( this.elActiveSticker )
	{
		this.elActiveSticker.classList.remove('active');
		var elEditBox = document.getElementById('edit_box');
		elEditBox.classList.remove('active');
	}
}

CStickerManager.prototype.UpdateStickerHandles = function()
{
	var elEditBox = document.getElementById('edit_box'); // @todo chrisk switch to class of elContainer if we ever need to have two editable boxes on one page

	var rect = this.elActiveSticker.getBoundingClientRect();
	var parentRect = this.elContainer.getBoundingClientRect();


	elEditBox.style.left =  1/this.fLocalScale * ( rect.left -  parentRect.left )  + "px";
	elEditBox.style.top = 1/this.fLocalScale * ( rect.top -  parentRect.top ) + "px";
	elEditBox.style.width = 1/this.fLocalScale * rect.width+ "px";
	elEditBox.style.height = 1/this.fLocalScale * rect.height+ "px";
}


CStickerManager.prototype.ShowEditHandles = function()
{

	document.getElementById('d_handle').addEventListener('mouseup', this.StickerDelete.bind(this ) );
	document.getElementById('s_handle').addEventListener('mousedown', this.StickerDragStart.bind(this, 'sx', 'sy', false ) );
	document.getElementById('r_handle').addEventListener('mousedown', this.StickerDragStart.bind(this, 'r', 'r', false) );

	this.elContainer.addEventListener('mousemove', this.StickerDragMove.bind(this) );
	this.elContainer.addEventListener('mouseup', this.StickerDragStop.bind(this) );

	// phones
	document.getElementById('d_handle').addEventListener('touchend', this.StickerDelete.bind(this  ) );
	document.getElementById('s_handle').addEventListener('touchstart', this.StickerDragStart.bind(this, 'sx', 'sy', false ) );
	document.getElementById('r_handle').addEventListener('touchstart', this.StickerDragStart.bind(this, 'r', 'r', false) );

	this.elContainer.addEventListener('touchmove', this.StickerDragMove.bind(this) );

	this.elContainer.addEventListener('touchend', this.StickerDragStop.bind(this) );
	this.elContainer.addEventListener('touchcancel', this.StickerDragStop.bind(this) );

	this.elContainer.addEventListener('drop', this.StickerDragDrop.bind(this) );
	this.elContainer.addEventListener('dragover', this.StickerDrag.bind(this) );

}

CStickerManager.prototype.StickerDragDrop = function( event )
{
	if( event.dataTransfer.getData('key') )
		this.AddSticker( event.dataTransfer.getData('key') );


}

CStickerManager.prototype.StickerDrag = function( event )
{

	event.preventDefault();
}

CStickerManager.prototype.StickerDelete = function(  )
{
	this.elActiveSticker.parentNode.removeChild(this.elActiveSticker);
	this.DeactivateSticker();
}

CStickerManager.prototype.StickerDragStart = function( propertyX, propertyY, propertyR, event )
{
	event.target.parentNode.classList.add('active');

	this.rgDragState = {
		x: event.screenX || event.touches[0].screenX,
		y: event.screenY || event.touches[0].screenY,
		property_x: propertyX,
		property_y: propertyY,
		property_r: propertyR
	};

	event.preventDefault();
};

CStickerManager.prototype.StickerDragStop = function( )
{
	this.rgDragState = false;
	event.preventDefault();

	var rgElements = document.querySelectorAll('#edit_box > div');

	for( var i=0; i<rgElements.length; i++)
		rgElements[i].classList.remove('active');


}



CStickerManager.prototype.StickerDragMove = function( event )
{
	//console.log(event);
	if ( !this.rgDragState )
		return;

	if( !this.BSceneUnlocked( this.strScene ) )
		return;
	var nTouchX = event.screenX || event.touches[0].screenX;
	var nTouchY = event.screenY || event.touches[0].screenY;

	var nTouchPageX = event.pageX || event.touches[0].pageX;
	var nTouchPageY = event.pageY || event.touches[0].pageY;

	if( this.rgDragState.property_x )
	{
		var xdelta  = nTouchX - this.rgDragState.x;

		if( this.rgDragState.property_x == "sx")
		{

			this.elActiveSticker.sticker.sx += xdelta / this.rgStickerDefinitions[ this.elActiveSticker.sticker.id ].w;

		}
		else
		{
			this.elActiveSticker.sticker[this.rgDragState.property_x] += xdelta;
		}


	}

	if( this.rgDragState.property_y )
	{
		var ydelta  = nTouchY - this.rgDragState.y;

		if( this.rgDragState.property_y == "sy")
		{
			this.elActiveSticker.sticker.sy += ydelta / this.rgStickerDefinitions[ this.elActiveSticker.sticker.id ].h;

		}
		else
			this.elActiveSticker.sticker[this.rgDragState.property_y] += ydelta;

	}

	// Balance sx/sy
	this.elActiveSticker.sticker.sx = this.elActiveSticker.sticker.sy;


	if( this.rgDragState.property_r )
	{


		var rect = this.elActiveSticker.getBoundingClientRect();
		var parentRect = this.elActiveSticker.getBoundingClientRect();

		var x = rect.left - parentRect.left + rect.width / 2;
		var y = rect.top - parentRect.top + rect.height / 2;


		var mousex = nTouchPageX - parentRect.left;
		var mousey = nTouchPageY - parentRect.top ;



		var angle = Math.atan2( mousey - y, mousex - x ) * 180 / Math.PI;


		this.elActiveSticker.sticker[this.rgDragState.property_r] = angle;

	}


	this.rgDragState.x = nTouchX;
	this.rgDragState.y = nTouchY;

	this.UpdateStickerState( this.elActiveSticker );
	this.UpdateStickerHandles();

	event.preventDefault();

}

CStickerManager.prototype.SetOwnedStickers = function( rgOwnership )
{
	this.rgOwnership = rgOwnership;
	this.unStickerPacks = rgOwnership.stickerpacks;



	this.PopulateSelectors();
	this.PopulateStickerList();
};

CStickerManager.prototype.SetSceneData = function( rgStuff )
{
	for ( var i = 0; i < this.rgSceneToIdMap.length; i++ )
	{
		this.rgSceneData[i] = rgStuff[i] || [];
	}

}

CStickerManager.prototype.BSceneHasSticker = function( strStickerId )
{
	var rgData = this.GetSceneData();
	for ( var i=0; i<rgData.length; i++ )
		if( rgData[i].id == strStickerId )
			return true;

	return false;
}


CStickerManager.prototype.GetSceneData = function()
{
	// pass
	var rgScene = [];
	var rgStickers = document.getElementsByClassName('sticker');

	if( rgStickers )
	{

		for ( var i = 0; i < rgStickers.length; i++ )
		{
			rgScene.push ( rgStickers[ i ].sticker );
		}
	}

	return rgScene;
};

CStickerManager.prototype.SaveScene = function( bFeature, bSilent )
{
	var rgRequest = {
		scene_data: this.GetSceneData(),
		sceneid: this.rgSceneToIdMap.indexOf( this.strScene ),
		sessionid: g_sessionID,
		active: bFeature ? 1 : 0
	};

	$J.ajax({
		url: g_strProfileURL + '/stickerssave/',
		data: rgRequest,
		method: 'POST'

	}).done(function() {

		if( !bSilent )
			ShowAlertDialog( "\u5df2\u4fdd\u5b58\u53d8\u66f4", "\u60a8\u7684\u8d34\u7eb8\u8fdb\u5ea6\u5df2\u88ab\u4fdd\u5b58\u3002" )

		console.log("SAVED");
	});
};

CStickerManager.prototype.UnlockScene = function(  )
{
	this.SaveScene(false, true);

	var nSceneId = this.rgSceneToIdMap.indexOf(this.strScene);

	var _this = this;

	$J.ajax({
		url: g_strProfileURL + '/stickerscomplete/',
		method: 'POST',
		data: {
			scene: nSceneId
		}


	}).done(function( data )
	{
		if( data.success == 1 )
		{
			ShowAlertDialog( "\u573a\u666f\u89e3\u9501\uff01", "\u60a8\u73b0\u5728\u53ef\u4ee5\u5728\u6b64\u573a\u666f\u4e2d\u79fb\u52a8\u3001\u65cb\u8f6c\u548c\u7f29\u653e\u8d34\u7eb8\uff0c\u4e5f\u53ef\u4ee5\u6dfb\u52a0\u5176\u4ed6\u573a\u666f\u7684\u8d34\u7eb8\uff0c\u5e76\u5c06\u5176\u663e\u793a\u4e8e\u60a8\u7684\u4e2a\u4eba\u8d44\u6599\u4e2d\uff01" );
			_this.rgOwnership.scenes[ nSceneId ] = 1;
			_this.PopulateStickerList();
		}
	});
}


CStickerManager.prototype.OpenPack = function()
{
	var _this = this;

	$J.ajax({
		url: g_strProfileURL + '/stickersopen/',
		method: 'POST'

	}).done(function( data ) {

		if( data && data.success == 1 && data.stickers.length > 0 )
		{
			var elContainer = document.createElement ( 'div' );
			elContainer.classList.add ( 'openpack_container' );

			var elDesc = document.createElement ( 'p' );
			elDesc.textContent = "\u60a8\u7684\u5408\u96c6\u4e2d\u5df2\u6dfb\u52a0 %1$s \u4e2a\u65b0\u8d34\u7eb8\u3002".
			replace ( /%1\$s/, data.stickers.length );

			elContainer.appendChild ( elDesc );


			var elStickerContainer = document.createElement ( 'div' );
			elStickerContainer.classList.add ( 'sticker_container' );


			while ( data.stickers.length )
			{

				var nStickerId = data.stickers.pop ();

				var elSticker = _this.CreateScaledSticker ( _this.rgStickerToIdMap[ nStickerId ], 140, 100, false );
				elStickerContainer.appendChild ( elSticker );
				_this.rgOwnership.stickers[ nStickerId ] = 1;

				var strStickerKey = _this.rgStickerToIdMap[ nStickerId ];
				var rgStickerDef = _this.rgStickerDefinitions[ strStickerKey ];
				var strScene = rgStickerDef.texture;

				if( _this.rgNewStickersCount[strScene] )
					_this.rgNewStickersCount[strScene]++;
				else
					_this.rgNewStickersCount[strScene] = 1;


			}

			elContainer.appendChild ( elStickerContainer );

			// Did we unlock any scenes?
			var strUnlockTexture = false;
			for ( var i = 0; i < data.stickers.length; i++ )
			{
				var stickerDef = _this.rgStickerDefinitions[ _this.rgStickerToIdMap[ i ] ];
				var strScene = stickerDef.texture;
				if ( _this.BSceneUnlocked ( strScene ) )
				{

					strUnlockTexture = _this.rgBackgroundTextures[ strScene ];
				}

			}

			if ( strUnlockTexture )
			{
				var elUnlockContainer = document.createElement ( 'div' );
				elUnlockContainer.classList.add ( 'unlock_container' );

				var elUnlockTitle = document.createElement ( 'h2' );
				elUnlockTitle.textContent = "\u573a\u666f\u89e3\u9501\uff01";

				var elUnlockSceneImg = document.createElement ( 'img' );
				elUnlockSceneImg.src = strUnlockTexture;

				var elUnlockDesc = document.createElement ( 'p' );
				elUnlockDesc.textContent = "\u60a8\u73b0\u5728\u53ef\u4ee5\u5728\u6b64\u573a\u666f\u4e2d\u79fb\u52a8\u3001\u65cb\u8f6c\u548c\u7f29\u653e\u8d34\u7eb8\uff0c\u4e5f\u53ef\u4ee5\u6dfb\u52a0\u5176\u4ed6\u573a\u666f\u7684\u8d34\u7eb8\uff0c\u5e76\u5c06\u5176\u663e\u793a\u4e8e\u60a8\u7684\u4e2a\u4eba\u8d44\u6599\u4e2d\uff01";

				elUnlockContainer.appendChild ( elUnlockSceneImg );
				elUnlockContainer.appendChild ( elUnlockTitle );
				elUnlockContainer.appendChild ( elUnlockDesc );
				elContainer.appendChild ( elUnlockContainer );
			}

			_this.unStickerPacks = data.stickerpacks;

			var Modal = ShowAlertDialog ( "\u60a8\u7684\u5408\u96c6\u4e2d\u5df2\u6dfb\u52a0\u65b0\u8d34\u7eb8\uff01", elContainer );
		}
		_this.PopulateStickerList();
		_this.PopulateSelectors();

		var elTarget  = document.getElementById(_this.strScene  + "_select_icon");
		if( elTarget )
			elTarget.classList.add('selected');




	});
}

// =====================================================================================================================

var CTaskManager = function(){}

CTaskManager.prototype.rgTaskList = [
	//k_ESummerSaleTaskUseDiscoveryQueue = 0;
	{
		name: "\u6d4f\u89c8\u60a8\u7684\u63a2\u7d22\u961f\u5217",
		desc: "\u8bbf\u95ee\u60a8\u7684<a href=\"https:\/\/store.steampowered.com\/explore\">\u4e2a\u4eba\u63a2\u7d22\u961f\u5217<\/a>\uff0c\u5e76\u4e00\u76f4\u70b9\u51fb\u5230\u6700\u540e\u3002\u60a8\u6bcf\u5929\u53ef\u4ee5\u5b8c\u6210\u6b64\u4efb\u52a1\u4e00\u6b21\u3002"	},
	//k_ESummerSaleTaskPlayAGame = 1;
	{
		name: "\u73a9\u4e00\u6b3e\u60a8\u5e93\u4e2d\u7684\u6e38\u620f",
		desc: "\u968f\u4fbf\u73a9\u4e00\u6b3e\u60a8\u7684 Steam \u5e93\u4e2d\u7684\u6e38\u620f\uff01\u4e0d\u8bba\u662f\u65b0\u6e38\u620f\uff0c\u8fd8\u662f\u60a8\u4e00\u76f4\u6ca1\u6765\u5f97\u53ca\u73a9\u7684\u65e7\u6e38\u620f\u2026\u2026"	},
	//k_ESummerSaleTaskViewFriendActivity = 2;
	{
		name: "\u67e5\u770b\u60a8\u7684\u597d\u53cb\u52a8\u6001\u9875\u9762",
		desc: "\u5728\u60a8\u7684<a href=\"https:\/\/steamcommunity.com\/my\/home\">\u597d\u53cb\u52a8\u6001<\/a>\u9875\u9762\u67e5\u770b\u60a8\u7684\u597d\u53cb\u5728 Steam \u4e0a\u7684\u65b0\u60c5\u51b5\u3002"	},
	//k_ESummerSaleTaskAddToWishlist = 3;
	{
		name: "\u6dfb\u52a0\u6e38\u620f\u81f3\u613f\u671b\u5355",
		desc: "\u627e\u5230\u60a8\u611f\u5174\u8da3\u7684\u4e00\u6b3e\u6e38\u620f\uff0c\u6dfb\u52a0\u5230<a href=\"https:\/\/steamcommunity.com\/my\/wishlist\">\u613f\u671b\u5355<\/a>\u3002"	},
	//k_ESummerSaleTaskReviewStorePreferences = 4;
	{
		name: "\u68c0\u67e5\u60a8\u7684\u504f\u597d\u8bbe\u7f6e",
		desc: "\u786e\u5b9a\u60a8\u7684<a href=\"https:\/\/store.steampowered.com\/account\/preferences\/\">\u5546\u5e97\u504f\u597d<\/a>\u4e0e\u60a8\u7684\u5174\u8da3\u7231\u597d\u4e00\u81f4\uff0c\u5e2e\u52a9 Steam \u5546\u5e97\u4e3a\u60a8\u5448\u73b0\u6700\u4f73\u4ea7\u54c1\u3002"	},
	//k_ESummerSaleTaskEarnAchievement = 5;
	{
		name: "\u83b7\u5f97\u4e00\u4e2a\u6210\u5c31",
		desc: "\u73a9\u60a8\u5e93\u4e2d\u7684\u4efb\u4f55\u4e00\u6b3e\u6e38\u620f\uff0c\u83b7\u5f97\u4e00\u4e2a\u6210\u5c31\u3002\u60a8\u53ef\u4ee5\u5728<a href=\"https:\/\/steamcommunity.com\/my\/games\">\u60a8\u7684\u201c\u6e38\u620f\u201d\u9875\u9762<\/a>\uff0c\u67e5\u770b\u60a8\u5728\u4efb\u4f55\u4e00\u6b3e\u6e38\u620f\u4e2d\u7684\u6210\u5c31\u8fdb\u5ea6\u3002"	},
	//k_ESummerSaleTaskVisitBroadcastPage = 6;
	{
		name: "\u8bbf\u95ee\u5b9e\u51b5\u76f4\u64ad\u9875\u9762",
		desc: "\u770b\u770b\u76ee\u524d\u793e\u533a\u4e2d\u6709\u54ea\u4e9b<a href=\"https:\/\/steamcommunity.com?subsection=broadcasts\">\u5b9e\u51b5\u76f4\u64ad<\/a>\u3002"	},
	//k_ESummerSaleTaskMarkReviewHelpful = 7;
	{
		name: "\u5c06\u4e00\u7bc7\u8bc4\u6d4b\u6807\u8bb0\u4e3a\u6709\u4ef7\u503c\u2026 \u6216\u65e0\u4ef7\u503c",
		desc: "Steam \u793e\u533a\u8bc4\u6d4b\u5bf9\u60a8\u8d2d\u4e70\u6e38\u620f\u6709\u6ca1\u6709\u8fc7\u5e2e\u52a9\uff1f\u5c06\u4e00\u6761\u8bc4\u6d4b\u6807\u8bb0\u4e3a\u6709\u4ef7\u503c\u3001\u65e0\u4ef7\u503c\u6216\u6b22\u4e50\u3002"	},
	//k_ESummerSaleTaskFollowCurator = 8;
	{
		name: "\u5173\u6ce8\u4e00\u540d\u9274\u8d4f\u5bb6",
		desc: "\u67e5\u770b <a href=\"https:\/\/store.steampowered.com\/curators\">Steam \u9274\u8d4f\u5bb6<\/a>\u5e76\u5173\u6ce8\u5c06\u6709\u52a9\u4e8e\u60a8\u5728 Steam \u4e0a\u627e\u5230\u6700\u4f73\u6e38\u620f\u7684\u9274\u8d4f\u5bb6\u3002"	},
	//k_ESummerSaleTaskViewAProfile = 9;
	{
		name: "\u67e5\u770b\u4e00\u4efd\u4e2a\u4eba\u8d44\u6599",
		desc: "\u770b\u770b<a href=\"https:\/\/steamcommunity.com\/my\/friends\">\u60a8\u7684\u597d\u53cb<\/a>\u5728 Steam \u793e\u533a\u4e2a\u4eba\u8d44\u6599\u9875\u4e0a\u663e\u793a\u4e86\u4e9b\u4ec0\u4e48\u5185\u5bb9\u3002"	},
	//k_ESummerSaleTaskViewATagPage = 10;
	{
		name: "\u6d4f\u89c8\u70ed\u95e8\u6807\u7b7e",
		desc: "\u4ece<a href=\"https:\/\/store.steampowered.com\/tag\/browse\">\u4e3a\u60a8\u63a8\u8350\u7684\u6807\u7b7e<\/a>\u4e2d\u9009\u4e00\u4e9b\u60a8\u611f\u5174\u8da3\u7684\uff0c\u8bd5\u8bd5\u770b\uff01"	},
	//k_ESummerSaleTaskMarkNotInterested = 11;
	{
		name: "\u6807\u8bb0\u201c\u4e0d\u611f\u5174\u8da3\u201d\u7684\u4ea7\u54c1",
		desc: "\u60a8\u4f1a\u5728\u5546\u5e97\u4e2d\u9047\u5230\u4e0d\u4e2d\u610f\u7684\u6e38\u620f\u3002\u70b9\u51fb\u201c\u4e0d\u611f\u5174\u8da3\u201d\u6309\u94ae\u2014\u2014\u522b\u62c5\u5fc3\uff0c\u53d7\u5f71\u54cd\u7684\u53ea\u662f\u90a3\u4e00\u6b3e\u6e38\u620f\u3002"	},
	//k_ESummerSaleTaskViewVideosPage = 12;
	{
		name: "\u6d4f\u89c8 Steam \u4e0a\u7684\u89c6\u9891",
		desc: "\u67e5\u770b Steam \u4e0a\u7684<a href=\"https:\/\/store.steampowered.com\/videos\">\u89c6\u9891\u4e2d\u5fc3<\/a>\u3002"	},
	//k_ESummerSaleTaskUploadAScreenshot = 13;
	{
		name: "\u8bbf\u95ee\u60a8\u7684\u622a\u56fe\u5e93",
		desc: "\u60a8\u53ef\u4ee5\u5236\u4f5c\u4e00\u5f20\u6e38\u620f\u5185\u622a\u56fe\uff08\u9ed8\u8ba4\u70ed\u952e\u4e3a F12\uff09\u5e76\u4e0a\u4f20\u81f3 Steam\uff1b\u5728 Steam \u793e\u533a\u4e2d<a href=\"https:\/\/steamcommunity.com\/my\/screenshots\">\u8bbf\u95ee\u60a8\u7684\u4e0a\u4f20\u622a\u56fe<\/a>\u3002"	},
	//k_ESummerSaleTaskPersonalizeProfile = 14;
	{
		name: "\u4e2a\u6027\u5316\u60a8\u7684 Steam \u793e\u533a\u4e2a\u4eba\u8d44\u6599",
		desc: "\u81ea\u5b9a\u4e49<a href=\"https:\/\/steamcommunity.com\/my\/profile\">\u60a8\u7684\u4e2a\u4eba\u8d44\u6599<\/a>\u6709\u8bb8\u591a\u79cd\u65b9\u5f0f\u3002\u8f7b\u8f7b\u4e00\u70b9\u5f15\u4eba\u6ce8\u76ee\u7684\u201c\u7f16\u8f91\u4e2a\u4eba\u8d44\u6599\u201d\u6309\u94ae\uff0c\u4fbf\u53ef\u5f00\u59cb\u4e2a\u6027\u5316\uff01"	},
	//k_ESummerSaleTaskPersonalizeDiscoveryQueue = 15;
	{
		name: "\u81ea\u5b9a\u4e49\u60a8\u7684\u63a2\u7d22\u961f\u5217",
		desc: "\u786e\u4fdd\u60a8\u81ea\u5b9a\u4e49\u7684\u63a2\u7d22\u961f\u5217\u5c5e\u4e8e\u60a8\u81ea\u5df1\uff1a\u60a8\u7684<a href=\"https:\/\/store.steampowered.com\/account\/preferences?discoveryqueue=1\">\u63a2\u7d22\u961f\u5217\u8bbe\u7f6e<\/a>\u5e94\u8be5\u4e0e\u60a8\u5e0c\u671b\u5728 Steam \u4e0a\u770b\u5230\u7684\u4e00\u81f4\u3002"	},
];

CTaskManager.prototype.RenderTaskList = function( rgProgress )
{
	// First pass, find tasks we need to do still

	var elTaskContainer = document.getElementById('tasks_remaining_container');
	var elTaskCompleteContainer = document.getElementById('tasks_completed_container');

	var rgTaskIdsShown = {};

	var nTasksToDo = 0;

	for( var i in rgProgress.tasks_remaining )
	{
		if( rgProgress.tasks_remaining[i] > 0 )
		{
			var rgTaskInfo = this.rgTaskList[i];
			rgTaskIdsShown[ i ] = 1;

			//if( !rgTaskInfo ) // ???
			//	continue;

			var elTask = document.createElement('div');
			elTask.classList.add('task');

			var elTaskName = document.createElement('h2');
			elTaskName.innerHTML = rgTaskInfo.name;

			var elTaskDesc = document.createElement('p');
			elTaskDesc.innerHTML = rgTaskInfo.desc;

			elTask.appendChild( elTaskName );
			elTask.appendChild( elTaskDesc );

			elTaskContainer.appendChild( elTask );

			nTasksToDo++;

		}
	}

	if( nTasksToDo == 0 )
	{
		var elT = document.getElementById('tasks_none');
		if( elT )
			elT.style.display = 'inline';
	} else if( nTasksToDo == 1 )
	{
		var elT = document.getElementById('tasks_one');
		if( elT )
			elT.style.display = 'inline';
	} else
	{
		var elT = document.getElementById('tasks_many');
		if( elT )
		{
			elT.style.display = 'inline';
			var elTC = document.getElementById('task_count');
			elTC.textContent = nTasksToDo;
		}
	}

	for(var i in rgProgress.tasks_limits )
	{
		if( rgProgress.tasks_limits[i] > 0 && !rgTaskIdsShown[i] )
		{
			var rgTaskInfo = this.rgTaskList[i];

			if( !rgTaskInfo ) // ???
				continue;

			var elTask = document.createElement('div');
			elTask.classList.add('task');

			elTask.innerHTML = '✔ ' + rgTaskInfo.name;



			elTaskCompleteContainer.appendChild( elTask );

		}
	}
}

