
<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

## utils/ExtensionInterface

ExtensionInterface defines utility methods for communicating between extensions safely.
A global `window.ExtensionInterface` object is made available in phoenix that can be called anytime after AppStart.

## Usage

For Eg. You may have two extensions installed say `angular` extension which has to call functions made available by
`angular-cli` Extension.

For Making this possible, the `angular-cli` extension makes a named interface available with the ExtensionInterface
module and `angular` extension can get hold of the interface as and when the extension gets loaded.

```js
// in angular-cli extension, make a file say cli-interface.js module within the extension, do the following:
const ExtensionInterface = brackets.getModule("utils/ExtensionInterface"),
// You can replace exports with any object you want to expose outside the extension really.
ExtensionInterface.registerExtensionInterface("angularCli", exports);
```

Once the interface is registered, the angular extension can get hold of the interface with the following code
(inside or outside the extension) by using:

```js
let angularCli;
ExtensionInterface.waitAndGetExtensionInterface("angularCli").then(interfaceObj=> angularCli = interfaceObj);
...
if(angularCli){ // check if angular cli is avilable
angularCli.callSomeFunction();
}
...
```

**Note** that the `angularCli` interface is async populated as and when the cli extension is loaded and the
interface made available.

**NBB:** Do Not use `await waitAndGetExtensionInterface` on tol level require as the module loading might fail.

## registerExtensionInterface

Registers a named extension interface. Will overwrite if an interface of the same name is already present.

Type: [function][1]

### Parameters

*   `extensionInterfaceName` **[string][2]** 
*   `interfaceObject` **[Object][3]** 

### Examples

To register an interface `angularCli`

```javascript
ExtensionInterface.registerExtensionInterface("angularCli", exports);
```

## isExistsExtensionInterface

Returns true is an interface of the given name exists.

Type: [function][1]

### Parameters

*   `extensionInterfaceName` **[string][2]** 

Returns **[boolean][4]** 

## waitAndGetExtensionInterface

Returns a promise that gets resolved only when an ExtensionInterface of the given name is registered. Use this
getter to get hold of extensions interface predictably.

Type: [function][1]

### Parameters

*   `extensionInterfaceName`  

### Examples

To get a registered interface `angularCli`

```javascript
let angularCli;
ExtensionInterface.waitAndGetExtensionInterface("angularCli").then(interfaceObj=> angularCli = interfaceObj);
...
if(angularCli){ // check if angular cli is avilable
angularCli.callSomeFunction();
}
...
```

Returns **[Promise][5]** 

[1]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function

[2]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String

[3]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object

[4]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean

[5]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise