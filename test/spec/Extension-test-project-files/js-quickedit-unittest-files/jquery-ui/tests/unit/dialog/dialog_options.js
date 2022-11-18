/*
 * dialog_options.js
 */
(function($) {

module("dialog: options");

test("autoOpen", function() {
	expect(2);

	el = $('<div></div>').dialog({ autoOpen: false });
		isNotOpen('.dialog({ autoOpen: false })');
	el.remove();

	el = $('<div></div>').dialog({ autoOpen: true });
		isOpen('.dialog({ autoOpen: true })');
	el.remove();
});

test("buttons", function() {
	expect(21);

	var btn, i, newButtons,
		buttons = {
		"Ok": function(ev, ui) {
			ok(true, "button click fires callback");
			equal(this, el[0], "context of callback");
			equal(ev.target, btn[0], "event target");
		},
		"Cancel": function(ev, ui) {
			ok(true, "button click fires callback");
			equal(this, el[0], "context of callback");
			equal(ev.target, btn[1], "event target");
		}
	};

	el = $('<div></div>').dialog({ buttons: buttons });
	btn = $("button", dlg());
	equal(btn.length, 2, "number of buttons");

	i = 0;
	$.each(buttons, function(key, val) {
		equal(btn.eq(i).text(), key, "text of button " + (i+1));
		i++;
	});

	ok(btn.parent().hasClass('ui-dialog-buttonset'), "buttons in container");
	ok(el.parent().hasClass('ui-dialog-buttons'), "dialog wrapper adds class about having buttons");

	btn.trigger("click");

	newButtons = {
		"Close": function(ev, ui) {
			ok(true, "button click fires callback");
			equal(this, el[0], "context of callback");
			equal(ev.target, btn[0], "event target");
		}
	};

	deepEqual(el.dialog("option", "buttons"), buttons, '.dialog("option", "buttons") getter');
	el.dialog("option", "buttons", newButtons);
	deepEqual(el.dialog("option", "buttons"), newButtons, '.dialog("option", "buttons", ...) setter');

	btn = $("button", dlg());
	equal(btn.length, 1, "number of buttons after setter");
	btn.trigger('click');

	i = 0;
	$.each(newButtons, function(key, val) {
		equal(btn.eq(i).text(), key, "text of button " + (i+1));
		i += 1;
	});

	el.dialog("option", "buttons", null);
	btn = $("button", dlg());
	equal(btn.length, 0, "all buttons have been removed");
	equal(el.find(".ui-dialog-buttonset").length, 0, "buttonset has been removed");
	equal(el.parent().hasClass('ui-dialog-buttons'), false, "dialog wrapper removes class about having buttons");

	el.remove();
});

test("buttons - advanced", function() {
	expect(5);

	el = $("<div></div>").dialog({
		buttons: [
			{
				text: "a button",
				"class": "additional-class",
				id: "my-button-id",
				click: function() {
					equal(this, el[0], "correct context");
				}
			}
		]
	});
	var buttons = dlg().find("button");
	equal(buttons.length, 1, "correct number of buttons");
	equal(buttons.attr("id"), "my-button-id", "correct id");
	equal(buttons.text(), "a button", "correct label");
	ok(buttons.hasClass("additional-class"), "additional classes added");
	buttons.click();

	el.remove();
});

test("closeOnEscape", function() {
	el = $('<div></div>').dialog({ closeOnEscape: false });
	ok(true, 'closeOnEscape: false');
	ok(dlg().is(':visible') && !dlg().is(':hidden'), 'dialog is open before ESC');
	el.simulate('keydown', { keyCode: $.ui.keyCode.ESCAPE })
		.simulate('keypress', { keyCode: $.ui.keyCode.ESCAPE })
		.simulate('keyup', { keyCode: $.ui.keyCode.ESCAPE });
	ok(dlg().is(':visible') && !dlg().is(':hidden'), 'dialog is open after ESC');

	el.remove();

	el = $('<div></div>').dialog({ closeOnEscape: true });
	ok(true, 'closeOnEscape: true');
	ok(dlg().is(':visible') && !dlg().is(':hidden'), 'dialog is open before ESC');
	el.simulate('keydown', { keyCode: $.ui.keyCode.ESCAPE })
		.simulate('keypress', { keyCode: $.ui.keyCode.ESCAPE })
		.simulate('keyup', { keyCode: $.ui.keyCode.ESCAPE });
	ok(dlg().is(':hidden') && !dlg().is(':visible'), 'dialog is closed after ESC');
});

test("closeText", function() {
	expect(3);

	el = $('<div></div>').dialog();
		equal(dlg().find('.ui-dialog-titlebar-close span').text(), 'close',
			'default close text');
	el.remove();

	el = $('<div></div>').dialog({ closeText: "foo" });
		equal(dlg().find('.ui-dialog-titlebar-close span').text(), 'foo',
			'closeText on init');
	el.remove();

	el = $('<div></div>').dialog().dialog('option', 'closeText', 'bar');
		equal(dlg().find('.ui-dialog-titlebar-close span').text(), 'bar',
			'closeText via option method');
	el.remove();
});

test("dialogClass", function() {
	expect(4);

	el = $('<div></div>').dialog();
		equal(dlg().is(".foo"), false, 'dialogClass not specified. foo class added');
	el.remove();

	el = $('<div></div>').dialog({ dialogClass: "foo" });
		equal(dlg().is(".foo"), true, 'dialogClass in init. foo class added');
	el.remove();

	el = $('<div></div>').dialog({ dialogClass: "foo bar" });
		equal(dlg().is(".foo"), true, 'dialogClass in init, two classes. foo class added');
		equal(dlg().is(".bar"), true, 'dialogClass in init, two classes. bar class added');
	el.remove();
});

test("draggable", function() {
	expect(4);

	el = $('<div></div>').dialog({ draggable: false });
		shouldnotmove();
		el.dialog('option', 'draggable', true);
		shouldmove();
	el.remove();

	el = $('<div></div>').dialog({ draggable: true });
		shouldmove();
		el.dialog('option', 'draggable', false);
		shouldnotmove();
	el.remove();
});

test("height", function() {
	expect(4);

	el = $('<div></div>').dialog();
		equal(dlg().outerHeight(), 150, "default height");
	el.remove();

	el = $('<div></div>').dialog({ height: 237 });
		equal(dlg().outerHeight(), 237, "explicit height");
	el.remove();

	el = $('<div></div>').dialog();
		el.dialog('option', 'height', 238);
		equal(dlg().outerHeight(), 238, "explicit height set after init");
	el.remove();

	el = $('<div></div>').css("padding", "20px")
		.dialog({ height: 240 });
		equal(dlg().outerHeight(), 240, "explicit height with padding");
	el.remove();
});

test("maxHeight", function() {
	expect(3);

	el = $('<div></div>').dialog({ maxHeight: 200 });
		drag('.ui-resizable-s', 1000, 1000);
		equal(heightAfter, 200, "maxHeight");
	el.remove();

	el = $('<div></div>').dialog({ maxHeight: 200 });
		drag('.ui-resizable-n', -1000, -1000);
		equal(heightAfter, 200, "maxHeight");
	el.remove();

	el = $('<div></div>').dialog({ maxHeight: 200 }).dialog('option', 'maxHeight', 300);
		drag('.ui-resizable-s', 1000, 1000);
		equal(heightAfter, 300, "maxHeight");
	el.remove();
});

test("maxWidth", function() {
	expect(3);

	el = $('<div></div>').dialog({ maxWidth: 200 });
		drag('.ui-resizable-e', 1000, 1000);
		equal(widthAfter, 200, "maxWidth");
	el.remove();

	el = $('<div></div>').dialog({ maxWidth: 200 });
		drag('.ui-resizable-w', -1000, -1000);
		equal(widthAfter, 200, "maxWidth");
	el.remove();

	el = $('<div></div>').dialog({ maxWidth: 200 }).dialog('option', 'maxWidth', 300);
		drag('.ui-resizable-w', -1000, -1000);
		equal(widthAfter, 300, "maxWidth");
	el.remove();
});

test("minHeight", function() {
	expect(3);

	el = $('<div></div>').dialog({ minHeight: 10 });
		drag('.ui-resizable-s', -1000, -1000);
		equal(heightAfter, 10, "minHeight");
	el.remove();

	el = $('<div></div>').dialog({ minHeight: 10 });
		drag('.ui-resizable-n', 1000, 1000);
		equal(heightAfter, 10, "minHeight");
	el.remove();

	el = $('<div></div>').dialog({ minHeight: 10 }).dialog('option', 'minHeight', 30);
		drag('.ui-resizable-n', 1000, 1000);
		equal(heightAfter, 30, "minHeight");
	el.remove();
});

test("minWidth", function() {
	expect(3);

	el = $('<div></div>').dialog({ minWidth: 10 });
		drag('.ui-resizable-e', -1000, -1000);
		equal(widthAfter, 10, "minWidth");
	el.remove();

	el = $('<div></div>').dialog({ minWidth: 10 });
		drag('.ui-resizable-w', 1000, 1000);
		equal(widthAfter, 10, "minWidth");
	el.remove();

	el = $('<div></div>').dialog({ minWidth: 30 }).dialog('option', 'minWidth', 30);
		drag('.ui-resizable-w', 1000, 1000);
		equal(widthAfter, 30, "minWidth");
	el.remove();
});

test("position, default center on window", function() {
	var el = $('<div></div>').dialog(),
		dialog = el.dialog('widget'),
		offset = dialog.offset();
	deepEqual(offset.left, Math.round($(window).width() / 2 - dialog.outerWidth() / 2) + $(window).scrollLeft());
	deepEqual(offset.top, Math.round($(window).height() / 2 - dialog.outerHeight() / 2) + $(window).scrollTop());
	el.remove();
});

test("position, top on window", function() {
	var el = $('<div></div>').dialog({ position: "top" }),
		dialog = el.dialog('widget'),
		offset = dialog.offset();
	deepEqual(offset.left, Math.round($(window).width() / 2 - dialog.outerWidth() / 2) + $(window).scrollLeft());
	deepEqual(offset.top, $(window).scrollTop());
	el.remove();
});

test("position, left on window", function() {
	var el = $('<div></div>').dialog({ position: "left" }),
		dialog = el.dialog('widget'),
		offset = dialog.offset();
	deepEqual(offset.left, 0);
	deepEqual(offset.top, Math.round($(window).height() / 2 - dialog.outerHeight() / 2) + $(window).scrollTop());
	el.remove();
});

test("position, right bottom on window", function() {
	var el = $('<div></div>').dialog({ position: "right bottom" }),
		dialog = el.dialog('widget'),
		offset = dialog.offset();
	deepEqual(offset.left, $(window).width() - dialog.outerWidth() + $(window).scrollLeft());
	deepEqual(offset.top, $(window).height() - dialog.outerHeight() + $(window).scrollTop());
	el.remove();
});

test("position, right bottom on window w/array", function() {
	var el = $('<div></div>').dialog({ position: ["right", "bottom"] }),
		dialog = el.dialog('widget'),
		offset = dialog.offset();
	deepEqual(offset.left, $(window).width() - dialog.outerWidth() + $(window).scrollLeft());
	deepEqual(offset.top, $(window).height() - dialog.outerHeight() + $(window).scrollTop());
	el.remove();
});

test("position, offset 