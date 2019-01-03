function deepClone(obj = {}, {
    setPrototype = false,
    invokeConstructors = true,
    copyNonEnumerables = false,
    copySymbols = false,
    copyGettersSetters = false,
} = {}) {

    if (!obj || typeof obj != 'object') {
        throw new TypeError(`TypeError: invalid 'obj' argument's type`);
    }

    const config = {
        setPrototype,
        invokeConstructors,
        copyNonEnumerables,
        copySymbols,
        copyGettersSetters,
    };

    if (typeof setPrototype != 'boolean') {
        throw new TypeError(`TypeError: invalid 'setPrototype' flag's type`);
    }

    if (typeof invokeConstructors != 'boolean') {
        throw new TypeError(`TypeError: invalid 'invokeConstructors' flag's type`);
    }

    if (typeof copyNonEnumerables != 'boolean') {
        throw new TypeError(`TypeError: invalid 'copyNonEnumerables' flag's type`);
    }

    if (typeof copySymbols != 'boolean') {
        throw new TypeError(`TypeError: invalid 'copySymbols' flag's type`);
    }

    if (typeof copyGettersSetters != 'boolean') {
        throw new TypeError(`TypeError: invalid 'copyGettersSetters' flag's type`);
    }

    // circular references guard
    // each analized object will store its reference here
    // so we can check each of its object properties to see if there are
    // reference to already analized objects
    const references = new WeakMap;

    return (function realDeepCopy(source, {
        setPrototype,
        invokeConstructors,
        copyNonEnumerables,
        copySymbols,
        copyGettersSetters,
    }) {

        // set a reference for the current obj into the guard
        references.set(source, source);

        // result value
        let res = null;

        // get all the property descriptors from the source object
        const ownPropsDcps = Object.getOwnPropertyDescriptors(source);


        // invokeConstructors flag indicates if the source constructor
        // must be invocated.
        if (invokeConstructors) {
            res = new source.constructor();
            // if so, the [[Prototype]] prop is already set up
        } else {
            // if not, we have to choose what to do with the [[Prototype]] prop
            // setPrototype flag indicates if we have to set up the same [[Prototype]] prop
            // as the source object or not
            // so the constructor property will be setted like in the previous case
            // but without invoking the constructor
            if (setPrototype) {
                res = Object.create(Object.getPrototypeOf(source));
            } else {
                res = {};
            }
        }

        // sibiling safe references
        // if an object contains another object more than one times
        // storing its reference in more than one prop
        // we have to restore this state
        const safeReferences = new WeakMap;

        // deep copy each prop from the source object to the res object
        Object.entries(ownPropsDcps).forEach(([prop, descriptor]) => {
            const {
                value,
                enumerable
            } = descriptor;

            // the copyNonEnumerables setted to true indicates that
            // we can copy non enumerable props
            // if we mustn't copy non enumerables and the current prop is no enumerable we return
            if (!copyNonEnumerables && !enumerable) return;

            // the copySymbols setted to true indicates that
            // we can copy symbol props
            // if we mustn't copy symbols and the current prop is a symbol we return
            if (!copySymbols && typeof value == 'symbol') return;

            // copyGettersSetters setted to true indicates that
            // we can copy getters and setters
            // if we mustn't copy g||s and the current prop has g||s we return
            if (!copyGettersSetters && (descriptor.get || descriptor.set)) return;

            // The Boolean, Number, and String objects are converted
            // to the corresponding primitive values
            if (
                value.constructor == String ||
                value.constructor == Number ||
                value.constructor == Boolean
            ) {
                descriptor.value = descriptor.value.valueOf();
                Object.defineProperty(res, prop, descriptor);
                return;
            }
            
            // Date objects are cloned mantaining the same Date
            if(value.constructor == Date) {
              descriptor.value = new Date(descriptor.value.getTime());
              Object.defineProperty(res, prop, descriptor);
              return
            }

            if (value && typeof value == 'object') {
                 
                // PRIOR check for circular references - 
                if (references.has(value)) {
                    throw new TypeError('TypeError: circular reference found');
                }

                // check for duplicated sibiling object references
                /*
                  const duplicatedObj = {};

                  const sourcej = {
                    a: duplicatedObj
                    b: duplicatedObj
                  }
                */
                if (safeReferences.has(value)) {
                    res[prop] = safeReferences.get(value);
                    return;
                }


                // recursive deep copy if the descriptor.value is an object
                res[prop] = realDeepCopy(value, {
                    setPrototype,
                    invokeConstructors
                });

                // set the object reference to avoid sibiling duplicates
                safeReferences.set(value, res[prop]);
            } else {
                // shallow copy for others props
                Object.defineProperty(res, prop, descriptor);
            }

        });

        return res;

    })(obj, config);
}
