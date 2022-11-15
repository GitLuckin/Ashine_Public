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
	equal($.datepicker._get(inst, 'showOn'), 'f