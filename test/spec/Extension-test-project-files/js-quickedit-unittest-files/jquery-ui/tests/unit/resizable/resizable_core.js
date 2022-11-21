/*
 * resizable_core.js
 */

var el;

var drag = function(el, dx, dy, complete) {

	// speed = sync -> Drag syncrhonously.
	// speed = fast|slow -> Drag asyncrhonously - animated.

	//this mouseover is to work around a limitation in resizable
	//TODO: fix resizable so handle doesn't require mouseover in order to be used
	$(el).simulate("mouseover");

	return $(el).simulate("drag", {
		dx: dx||0, dy: dy||0, speed: 'sync', complete: complete
	});
};

(function($) {

module("resizable: core");

/*
test("element types", function() {
	var typeNames = ('p,h1,h2,h3,h4,h5,h6,blockquote,ol,ul,dl,div,form'
		+ ',table,fieldset,address,ins,del,em,strong,q,cite,dfn,abbr'
		+ ',acronym,code,samp,kbd,var,img,object,hr'
		+ ',input,button,label,select,iframe').split(',');

	$.each(typeNames, function(i) {
		var typeName = typeNames[i];
		el = $(document.createElement(typeName)).appendTo('body');
		(typeName == 'table' && el.append("<tr><td>content</td></tr>"));
		el.resizable();
		ok(true, '$("&lt;' + typeName + '/&gt").resizable()');
		el.resizable("destroy");
		el.remove();
	});
});
*/

test("n", function() {
	expect(2);

	var handle = '.ui-resizable-n', target = $('#resizable1').resizable({ handles: 'all' });

	drag(handle, 0, -50);
	equal( target.height(), 150, "compare height" );

	drag(handle, 0, 50);
	equal( target.height(), 100, "compare height" );
});

test("s", function() {
	expect(2);

	var handle = '.ui-resizable-s', target = $('#resizable1').re