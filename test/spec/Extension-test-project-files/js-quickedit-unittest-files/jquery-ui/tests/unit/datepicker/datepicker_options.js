/*
 * datepicker_options.js
 */

(function($) {

module("datepicker: options");

test('setDefaults', function() {
	var inp = init('#inp');
	equal($.datepicker._defaults.showOn, 'focus', 'Initial showOn');
	$.datepicker.setDefaults({showOn: 'button'});
	equal($.datepicker._defaults.showOn, 'button', 'Change default showOn');
	$.datepicker.setDefaults({showOn: 'focus'});
	equal($.datepicker._defaults.showOn, 'focus', 'Restore showOn');
});

test('option', function() {
	var inp = init('#inp'),
	inst = $.data(inp[0], PROP_NAME);
	// Set option
	equal(inst.settings.showOn, null, 'Initial setting showOn');
	equal($.datepicker._get(inst, 'showOn'), 'focus', 'Initial instance showOn');
	equal($.datepicker._defaults.showOn, 'focus', 'Initial default showOn');
	inp.datepicker('option', 'showOn', 'button');
	equal(inst.settings.showOn, 'button', 'Change setting showOn');
	equal($.datepicker._get(inst, 'showOn'), 'button', 'Change instance showOn');
	equal($.datepicker._defaults.showOn, 'focus', 'Retain default showOn');
	inp.datepicker('option', {showOn: 'both'});
	equal(inst.settings.showOn, 'both', 'Change setting showOn');
	equal($.datepicker._get(inst, 'showOn'), 'both', 'Change instance showOn');
	equal($.datepicker._defaults.showOn, 'focus', 'Retain default showOn');
	inp.datepicker('option', 'showOn', undefined);
	equal(inst.settings.showOn, null, 'Clear setting showOn');
	equal($.datepicker._get(inst, 'showOn'), 'focus', 'Restore instance showOn');
	equal($.datepicker._defaults.showOn, 'focus', 'Retain default showOn');
	// Get option
	inp = init('#inp');
	equal(inp.datepicker('option', 'showOn'), 'focus', 'Initial setting showOn');
	inp.datepicker('option', 'showOn', 'button');
	equal(inp.datepicker('option', 'showOn'), 'button', 'Change instance showOn');
	inp.datepicker('option', 'showOn', undefined);
	equal(inp.datepicker('option', 'showOn'), 'focus', 'Reset instance showOn');
	deepEqual(inp.datepicker('option', 'all'), {showAnim: ''}, 'Get instance settings');
	deepEqual(inp.datepicker('option', 'defaults'), $.datepicker._defaults,
		'Get default settings');
});

test('change', function() {
	var inp = init('#inp'),
	inst = $.data(inp[0], PROP_NAME);
	equal(inst.settings.showOn, null, 'Initial setting showOn');
	equal($.datepicker._get(inst, 'showOn'), 'focus', 'Initial instance showOn');
	equal($.datepicker._defaults.showOn, 'focus', 'Initial default showOn');
	inp.datepicker('change', 'showOn', 'button');
	equal(inst.settings.showOn, 'button', 'Change setting showOn');
	equal($.datepicker._get(inst, 'showOn'), 'button', 'Change instance showOn');
	equal($.datepicker._defaults.showOn, 'focus', 'Retain default showOn');
	inp.datepicker('change', {showOn: 'both'});
	equal(inst.settings.showOn, 'both', 'Change setting showOn');
	equal($.datepicker._get(inst, 'showOn'), 'both', 'Change instance showOn');
	equal($.datepicker._defaults.showOn, 'focus', 'Retain default showOn');
	inp.datepicker('change', 'showOn', undefined);
	equal(inst.settings.showOn, null, 'Clear setting showOn');
	equal($.datepicker._get(inst, 'showOn'), 'focus', 'Restore instance showOn');
	equal($.datepicker._defaults.showOn, 'focus', 'Retain default showOn');
});

test('invocation', function() {
	var button, image,
		inp = init('#inp'),
		dp = $('#ui-datepicker-div'),
		body = $('body');
	// On focus
	button = inp.siblings('button');
	ok(button.length === 0, 'Focus - button absent');
	image = inp.siblings('img');
	ok(image.length === 0, 'Focus - image absent');
	inp.focus();
	ok(dp.is(':visible'), 'Focus - rendered on focus');
	inp.simulate('keydown', {keyCode: $.ui.keyCode.ESCAPE});
	ok(!dp.is(':visible'), 'Focus - hidden on exit');
	inp.focus();
	ok(dp.is(':visible'), 'Focus - rendered on focus');
	body.simulate('mousedown', {});
	ok(!dp.is(':visible'), 'Focus - hidden on external click');
	inp.datepicker('hide').datepicker('destroy');
	// On button
	inp = init('#inp', {showOn: 'button', buttonText: 'Popup'});
	ok(!dp.is(':visible'), 'Button - initially hidden');
	button = inp.siblings('button');
	image = inp.siblings('img');
	ok(button.length === 1, 'Button - button present');
	ok(image.length === 0, 'Button - image absent');
	equal(button.text(), 'Popup', 'Button - button text');
	inp.focus();
	ok(!dp.is(':visible'), 'Button - not rendered on focus');
	button.click();
	ok(dp.is(':visible'), 'Button - rendered on button click');
	button.click();
	ok(!dp.is(':visible'), 'Button - hidden on second button click');
	inp.datepicker('hide').datepicker('destroy');
	// On image button
	inp = init('#inp', {showOn: 'button', buttonImageOnly: true,
		buttonImage: 'img/calendar.gif', buttonText: 'Cal'});
	ok(!dp.is(':visible'), 'Image button - initially hidden');
	button = inp.siblings('button');
	ok(button.length === 0, 'Image button - button absent');
	image = inp.siblings('img');
	ok(image.length === 1, 'Image button - image present');
	equal(image.attr('src'), 'img/calendar.gif', 'Image button - image source');
	equal(image.attr('title'), 'Cal', 'Image button - image text');
	inp.focus();
	ok(!dp.is(':visible'), 'Image button - not rendered on focus');
	image.click();
	ok(dp.is(':visible'), 'Image button - rendered on image click');
	image.click();
	ok(!dp.is(':visible'), 'Image button - hidden on second image click');
	inp.datepicker('hide').datepicker('destroy');
	// On both
	inp = init('#inp', {showOn: 'both', buttonImage: 'img/calendar.gif'});
	ok(!dp.is(':visible'), 'Both - initially hidden');
	button = inp.siblings('button');
	ok(button.length === 1, 'Both - button present');
	image = inp.siblings('img');
	ok(image.length === 0, 'Both - image absent');
	image = button.children('img');
	ok(image.length === 1, 'Both - button image present');
	inp.focus();
	ok(dp.is(':visible'), 'Both - rendered on focus');
	body.simulate('mousedown', {});
	ok(!dp.is(':visible'), 'Both - hidden on external click');
	button.click();
	ok(dp.is(':visible'), 'Both - rendered on button click');
	button.click();
	ok(!dp.is(':visible'), 'Both - hidden on second button click');
	inp.datepicker('hide').datepicker('destroy');
});

test('otherMonths', function() {
	var inp = init('#inp'),
		pop = $('#ui-datepicker-div');
	inp.val('06/01/2009').datepicker('show');
	equal(pop.find('tbody').text(), '\u00a0123456789101112131415161718192021222324252627282930\u00a0\u00a0\u00a0\u00a0',
		'Other months - none');
	ok(pop.find('td:last *').length === 0, 'Other months - no content');
	inp.datepicker('hide').datepicker('option', 'showOtherMonths', true).datepicker('show');
	equal(pop.find('tbody').text(), '311234567891011121314151617181920212223242526272829301234',
		'Other months - show');
	ok(pop.find('td:last span').length === 1, 'Other months - span content');
	inp.datepicker('hide').datepicker('option', 'selectOtherMonths', true).datepicker('show');
	equal(pop.find('tbody').text(), '311234567891011121314151617181920212223242526272829301234',
		'Other months - select');
	ok(pop.find('td:last a').length === 1, 'Other months - link content');
	inp.datepicker('hide').datepicker('option', 'showOtherMonths', false).datepicker('show');
	equal(pop.find('tbody').text(), '\u00a0123456789101112131415161718192021222324252627282930\u00a0\u00a0\u00a0\u00a0',
		'Other months - none');
	ok(pop.find('td:last *').length === 0, 'Other months - no content');
});

test('defaultDate', function() {
	var inp = init('#inp'),
		date = new Date();
	inp.val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), date, 'Default date null');
	// Numeric values
	inp.datepicker('option', {defaultDate: -2}).
		datepicker('hide').val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date.setDate(date.getDate() - 2);
	equalsDate(inp.datepicker('getDate'), date, 'Default date -2');
	inp.datepicker('option', {defaultDate: 3}).
		datepicker('hide').val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date.setDate(date.getDate() + 5);
	equalsDate(inp.datepicker('getDate'), date, 'Default date 3');
	inp.datepicker('option', {defaultDate: 1 / 0}).
		datepicker('hide').val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date.setDate(date.getDate() - 3);
	equalsDate(inp.datepicker('getDate'), date, 'Default date Infinity');
	inp.datepicker('option', {defaultDate: 1 / 'a'}).
		datepicker('hide').val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), date, 'Default date NaN');
	// String offset values
	inp.datepicker('option', {defaultDate: '-1d'}).
		datepicker('hide').val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date.setDate(date.getDate() - 1);
	equalsDate(inp.datepicker('getDate'), date, 'Default date -1d');
	inp.datepicker('option', {defaultDate: '+3D'}).
		datepicker('hide').val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date.setDate(date.getDate() + 4);
	equalsDate(inp.datepicker('getDate'), date, 'Default date +3D');
	inp.datepicker('option', {defaultDate: ' -2 w '}).
		datepicker('hide').val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date = new Date();
	date.setDate(date.getDate() - 14);
	equalsDate(inp.datepicker('getDate'), date, 'Default date -2 w');
	inp.datepicker('option', {defaultDate: '+1 W'}).
		datepicker('hide').val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date.setDate(date.getDate() + 21);
	equalsDate(inp.datepicker('getDate'), date, 'Default date +1 W');
	inp.datepicker('option', {defaultDate: ' -1 m '}).
		datepicker('hide').val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date = addMonths(new Date(), -1);
	equalsDate(inp.datepicker('getDate'), date, 'Default date -1 m');
	inp.datepicker('option', {defaultDate: '+2M'}).
		datepicker('hide').val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date = addMonths(new Date(), 2);
	equalsDate(inp.datepicker('getDate'), date, 'Default date +2M');
	inp.datepicker('option', {defaultDate: '-2y'}).
		datepicker('hide').val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date = new Date();
	date.setFullYear(date.getFullYear() - 2);
	equalsDate(inp.datepicker('getDate'), date, 'Default date -2y');
	inp.datepicker('option', {defaultDate: '+1 Y '}).
		datepicker('hide').val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date.setFullYear(date.getFullYear() + 3);
	equalsDate(inp.datepicker('getDate'), date, 'Default date +1 Y');
	inp.datepicker('option', {defaultDate: '+1M +10d'}).
		datepicker('hide').val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date = addMonths(new Date(), 1);
	date.setDate(date.getDate() + 10);
	equalsDate(inp.datepicker('getDate'), date, 'Default date +1M +10d');
	// String date values
	inp.datepicker('option', {defaultDate: '07/04/2007'}).
		datepicker('hide').val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date = new Date(2007, 7 - 1, 4);
	equalsDate(inp.datepicker('getDate'), date, 'Default date 07/04/2007');
	inp.datepicker('option', {dateFormat: 'yy-mm-dd', defaultDate: '2007-04-02'}).
		datepicker('hide').val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date = new Date(2007, 4 - 1, 2);
	equalsDate(inp.datepicker('getDate'), date, 'Default date 2007-04-02');
	// Date value
	date = new Date(2007, 1 - 1, 26);
	inp.datepicker('option', {dateFormat: 'mm/dd/yy', defaultDate: date}).
		datepicker('hide').val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), date, 'Default date 01/26/2007');
});

test('miscellaneous', function() {
	var curYear, longNames, shortNames, date,
		dp = $('#ui-datepicker-div'),
		inp = init('#inp');
	// Year range
	function genRange(start, offset) {
		var i = start,
			range = '';
		for (; i < start + offset; i++) {
			range += i;
		}
		return range;
	}
	curYear = new Date().getFullYear();
	inp.val('02/04/2008').datepicker('show');
	equal(dp.find('.ui-datepicker-year').text(), '2008', 'Year range - read-only default');
	inp.datepicker('hide').datepicker('option', {changeYear: true}).datepicker('show');
	equal(dp.find('.ui-datepicker-year').text(), genRange(2008 - 10, 21), 'Year range - changeable default');
	inp.datepicker('hide').datepicker('option', {yearRange: 'c-6:c+2', changeYear: true}).datepicker('show');
	equal(dp.find('.ui-datepicker-year').text(), genRange(2008 - 6, 9), 'Year range - c-6:c+2');
	inp.datepicker('hide').datepicker('option', {yearRange: '2000:2010', changeYear: true}).datepicker('show');
	equal(dp.find('.ui-datepicker-year').text(), genRange(2000, 11), 'Year range - 2000:2010');
	inp.datepicker('hide').datepicker('option', {yearRange: '-5:+3', changeYear: true}).datepicker('show');
	equal(dp.find('.ui-datepicker-year').text(), genRange(curYear - 5, 9), 'Year range - -5:+3');
	inp.datepicker('hide').datepicker('option', {yearRange: '2000:-5', changeYear: true}).datepicker('show');
	equal(dp.find('.ui-datepicker-year').text(), genRange(2000, curYear - 2004), 'Year range - 2000:-5');
	inp.datepicker('hide').datepicker('option', {yearRange: '', changeYear: true}).datepicker('show');
	equal(dp.find('.ui-datepicker-year').text(), genRange(curYear, 1), 'Year range - -6:+2');

	// Navigation as date format
	inp.datepicker('option', {showButtonPanel: true});
	equal(dp.find('.ui-datepicker-prev').text(), 'Prev', 'Navigation prev - default');
	equal(dp.find('.ui-datepicker-current').text(), 'Today', 'Navigation current - default');
	equal(dp.find('.ui-datepicker-next').text(), 'Next', 'Navigation next - default');
	inp.datepicker('hide').datepicker('option', {navigationAsDateFormat: true, prevText: '< M', currentText: 'MM', nextText: 'M >'}).
		val('02/04/2008').datepicker('show');
	longNames = $.datepicker.regional[''].monthNames;
	shortNames = $.datepicker.regional[''].monthNamesShort;
	date = new Date();
	equal(dp.find('.ui-datepicker-prev').text(), '< ' + shortNames[0], 'Navigation prev - as date format');
	equal(dp.find('.ui-datepicker-current').text(),
		longNames[date.getMonth()], 'Navigation current - as date format');
	equal(dp.find('.ui-datepicker-next').text(),
		shortNames[2] + ' >', 'Navigation next - as date format');
	inp.simulate('keydown', {keyCode: $.ui.keyCode.PAGE_DOWN});
	equal(dp.find('.ui-datepicker-prev').text(),
		'< ' + shortNames[1], 'Navigation prev - as date format + pgdn');
	equal(dp.find('.ui-datepicker-current').text(),
		longNames[date.getMonth()], 'Navigation current - as date format + pgdn');
	equal(dp.find('.ui-datepicker-next').text(),
		shortNames[3] + ' >', 'Navigation next - as date format + pgdn');
	inp.datepicker('hide').datepicker('option', {gotoCurrent: true}).
		val('02/04/2008').datepicker('show');
	equal(dp.find('.ui-datepicker-prev').text(),
		'< ' + shortNames[0], 'Navigation prev - as date format + goto current');
	equal(dp.find('.ui-datepicker-current').text(),
		longNames[1], 'Navigation current - as date format + goto current');
	equal(dp.find('.ui-datepicker-next').text(),
		shortNames[2] + ' >', 'Navigation next - as date format + goto current');
});

test('minMax', function() {
	var date,
		inp = init('#inp'),
		lastYear = new Date(2007, 6 - 1, 4),
		nextYear = new Date(2009, 6 - 1, 4),
		minDate = new Date(2008, 2 - 1, 29),
		maxDate = new Date(2008, 12 - 1, 7);
	inp.val('06/04/2008').datepicker('show');
	inp.simulate('keydown', {ctrlKey: true, keyCode: $.ui.keyCode.PAGE_UP}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), lastYear,
		'Min/max - null, null - ctrl+pgup');
	inp.val('06/04/2008').datepicker('show');
	inp.simulate('keydown', {ctrlKey: true, keyCode: $.ui.keyCode.PAGE_DOWN}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), nextYear,
		'Min/max - null, null - ctrl+pgdn');
	inp.datepicker('option', {minDate: minDate}).
		datepicker('hide').val('06/04/2008').datepicker('show');
	inp.simulate('keydown', {ctrlKey: true, keyCode: $.ui.keyCode.PAGE_UP}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), minDate,
		'Min/max - 02/29/2008, null - ctrl+pgup');
	inp.val('06/04/2008').datepicker('show');
	inp.simulate('keydown', {ctrlKey: true, keyCode: $.ui.keyCode.PAGE_DOWN}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), nextYear,
		'Min/max - 02/29/2008, null - ctrl+pgdn');
	inp.datepicker('option', {maxDate: maxDate}).
		datepicker('hide').val('06/04/2008').datepicker('show');
	inp.simulate('keydown', {ctrlKey: true, keyCode: $.ui.keyCode.PAGE_UP}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), minDate,
		'Min/max - 02/29/2008, 12/07/2008 - ctrl+pgup');
	inp.val('06/04/2008').datepicker('show');
	inp.simulate('keydown', {ctrlKey: true, keyCode: $.ui.keyCode.PAGE_DOWN}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), maxDate,
		'Min/max - 02/29/2008, 12/07/2008 - ctrl+pgdn');
	inp.datepicker('option', {minDate: null}).
		datepicker('hide').val('06/04/2008').datepicker('show');
	inp.simulate('keydown', {ctrlKey: true, keyCode: $.ui.keyCode.PAGE_UP}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), lastYear,
		'Min/max - null, 12/07/2008 - ctrl+pgup');
	inp.val('06/04/2008').datepicker('show');
	inp.simulate('keydown', {ctrlKey: true, keyCode: $.ui.keyCode.PAGE_DOWN}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), maxDate,
		'Min/max - null, 12/07/2008 - ctrl+pgdn');
	// Relative dates
	date = new Date();
	date.setDate(date.getDate() - 7);
	inp.datepicker('option', {minDate: '-1w', maxDate: '+1 M +10 D '}).
		datepicker('hide').val('').datepicker('show');
	inp.simulate('keydown', {ctrlKey: true, keyCode: $.ui.keyCode.PAGE_UP}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), date,
		'Min/max - -1w, +1 M +10 D - ctrl+pgup');
	date = addMonths(new Date(), 1);
	date.setDate(date.getDate() + 10);
	inp.val('').datepicker('show');
	inp.simulate('keydown', {ctrlKey: true, keyCode: $.ui.keyCode.PAGE_DOWN}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), date,
		'Min/max - -1w, +1 M +10 D - ctrl+pgdn');
	// With existing date
	inp = init('#inp');
	inp.val('06/04/2008').datepicker('option', {minDate: minDate});
	equalsDate(inp.datepicker('getDate'), new Date(2008, 6 - 1, 4), 'Min/max - setDate > min');
	inp.datepicker('option', {minDate: null}).val('01/04/2008').datepicker('option', {minDate: minDate});
	equalsDate(inp.datepicker('getDate'), minDate, 'Min/max - setDate < min');
	inp.datepicker('option', {minDate: null}).val('06/04/2008').datepicker('option', {maxDate: maxDate});
	equalsDate(inp.datepicker('getDate'), new Date(2008, 6 - 1, 4), 'Min/max - setDate < max');
	inp.datepicker('option', {maxDate: null}).val('01/04/2009').datepicker('option', {maxDate: maxDate});
	equalsDate(inp.datepicker('getDate'), maxDate, 'Min/max - setDate > max');
	inp.datepicker('option', {maxDate: null}).val('01/04/2008').datepicker('option', {minDate: minDate, maxDate: maxDate});
	equalsDate(inp.datepicker('getDate'), minDate, 'Min/max - setDate < min');
	inp.datepicker('option', {maxDate: null}).val('06/04/2008').datepicker('option', {minDate: minDate, maxDate: maxDate});
	equalsDate(inp.datepicker('getDate'), new Date(2008, 6 - 1, 4), 'Min/max - setDate > min, < max');
	inp.datepicker('option', {maxDate: null}).val('01/04/2009').datepicker('option', {minDate: minDate, maxDate: maxDate});
	equalsDate(inp.datepicker('getDate'), maxDate, 'Min/max - setDate > max');
});

test('setDate', function() {
	var inl, alt, minDate, maxDate, dateAndTimeToSet, dateAndTimeClone,
		inp = init('#inp'),
		date1 = new Date(2008, 6 - 1, 4),
		date2 = new Date();
	ok(inp.datepicker('getDate') == null, 'Set date - default');
	inp.datepicker('setDate', date1);
	equalsDate(inp.datepicker('getDate'), date1, 'Set date - 2008-06-04');
	date1 = new Date();
	date1.setDate(date1.getDate() + 7);
	inp.datepicker('setDate', +7);
	equalsDate(inp.datepicker('getDate'), date1, 'Set date - +7');
	date2.setFullYear(date2.getFullYear() + 2);
	inp.datepicker('setDate', '+2y');
	equalsDate(inp.datepicker('getDate'), date2, 'Set date - +2y');
	inp.datepicker('setDate', date1, date2);
	equalsDate(inp.datepicker('getDate'), date1, 'Set date - two dates');
	inp.datepicker('setDate');
	ok(inp.datepicker('getDate') == null, 'Set d