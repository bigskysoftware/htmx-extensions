/*
  Server Commands Extension (<htmx> tags)
  ======================================================
  This extension enables out-of-band swaps on steroids using custom <htmx> elements in a server response.
  It lets you send commands for swapping content, triggering events, and managing browser history.

  It is inspired by Rails' <turbo-stream>, data-star, and is compatible with the sse & websockets extensions out of the box.
*/
(function () {
    /** @type {import("../htmx").HtmxInternalApi} */
    let api;

    // <htmx> tag valid attributes
    const ATTRIBUTES = new Set([
        'target',
        'swap',
        'select',
        'redirect',
        'refresh',
        'location',
        'push-url',
        'replace-url',
        'trigger',
        'trigger-after-swap',
        'trigger-after-settle',
    ]);

    htmx.defineExtension('server-commands', {
        /** @param {import("../htmx").HtmxInternalApi} apiRef */
        init: function (apiRef) {
            api = apiRef;
        },

        /**
         * @param {string} text
         * @param {XMLHttpRequest} xhr
         * @param {Element} elt - The element that triggered the request (with hx-get/hx-post/etc. or sse-connect)
         */
        transformResponse: function (text, xhr, elt) {
            const triggeringElement = elt;

            // Check if empty text, or no <htmx> tags
            const fragment = text ? api.makeFragment(text) : null;
            if (!fragment || !fragment.querySelector('htmx')) {
                return text; // Return early
            }

            // Find all <htmx> tags
            const commandElements = fragment.querySelectorAll('htmx');

            // Keep only top-level ones (direct children of the fragment)
            const topLevelCommandElements = Array.from(commandElements).filter(el => {
                // Check if this htmx element is a direct child of the fragment
                return el.parentNode === fragment;
            });

            if (commandElements.length > topLevelCommandElements.length) {
                console.warn(
                    '[server-commands] Nested <htmx> tags are not supported and will be discarded.'
                );
            }

            // Process ONLY the top-level <htmx> tags in order
            (async () => {
                for (const commandElement of topLevelCommandElements) {
                    await processCommandElement(commandElement, triggeringElement);
                }
            })();

            // Remove all <htmx> tags from the fragment
            commandElements.forEach(el => el.remove());

            // Serialize remaining nodes into an HTML string
            const container = document.createElement('div');
            container.appendChild(fragment);

            return container.innerHTML;
        },
    });

    /**
     * Processes a single <htmx> element by reading its attributes and executing
     * actions in a fixed, sequential order.
     * @param {HTMLElement} commandElement - The <htmx> element to process
     * @param {Element} triggeringElement - The element that triggered the request (e.g. with hx-get/hx-post/etc. or sse-connect)
     */
    async function processCommandElement(commandElement, triggeringElement) {
        try {
            // Fire cancelable event
            if (api.triggerEvent(triggeringElement, 'htmx:beforeServerCommand', { commandElement }) === false) return;

            validateCommandElement(commandElement);

            // Gather swap jobs
            const swapJobs = [];

            const swapStyle = api.getAttributeValue(commandElement, 'swap') || 'outerHTML';
            const select = api.getAttributeValue(commandElement, 'select');
            const targetSelector = api.getAttributeValue(commandElement, 'target');

            if (targetSelector) {
                const targetElement = htmx.find(targetSelector);
                if (targetElement) {
                    swapJobs.push({ targetElement, content: commandElement.innerHTML });
                } else {
                    const error = new Error(`[server-commands] Target selector "${targetSelector}" did not match any elements.`);
                    api.triggerErrorEvent(triggeringElement, 'htmx:targetError', { error: error, target: targetSelector });
                }
            }

            if (api.hasAttribute(commandElement, 'trigger')) {
                const trigger = api.getAttributeValue(commandElement, 'trigger');
                handleTriggerAttribute(trigger);
            }
            if (api.hasAttribute(commandElement, 'location')) {
                const redirectPath = api.getAttributeValue(commandElement, 'location');
                handleLocationAttribute(redirectPath);
            }
            if (api.hasAttribute(commandElement, 'redirect')) {
                window.location.href = api.getAttributeValue(commandElement, 'redirect');
                return; // Stop processing
            }
            if (api.hasAttribute(commandElement, 'refresh') && api.getAttributeValue(commandElement, 'refresh') !== 'false') {
                const shouldRefresh = api.getAttributeValue(commandElement, 'refresh') !== 'false';
                if (shouldRefresh) window.location.reload();
                return; // Stop processing
            }
            if (api.hasAttribute(commandElement, 'push-url')) {
                api.saveCurrentPageToHistory();
                api.pushUrlIntoHistory(api.getAttributeValue(commandElement, 'push-url'));
            }
            if (api.hasAttribute(commandElement, 'replace-url')) {
                api.saveCurrentPageToHistory();
                api.replaceUrlInHistory(api.getAttributeValue(commandElement, 'replace-url'));
            }

            // --- STEP 3: PROCESS SWAP JOBS WITH TIMED TRIGGERS ---
            if (swapJobs.length > 0) {
                const swapSpec = api.getSwapSpecification(triggeringElement, swapStyle);

                for (const job of swapJobs) {
                    const beforeSwapDetails = {
                        elt: triggeringElement,
                        target: job.targetElement,
                        swapSpec: swapSpec,
                        serverResponse: job.content,
                        shouldSwap: true,
                        fromServerCommand: true  // Custom flag to indicate the swap is from a server command
                    };

                    // Fire cancelable event
                    if (api.triggerEvent(job.targetElement, 'htmx:beforeSwap', beforeSwapDetails) === false) continue;

                    if (beforeSwapDetails.shouldSwap) {
                        // Use htmx's built-in swap with callbacks for trigger coordination
                        api.swap(
                            beforeSwapDetails.target,
                            beforeSwapDetails.serverResponse,
                            beforeSwapDetails.swapSpec,
                            {
                                select: select,
                                eventInfo: { elt: triggeringElement },
                                contextElement: triggeringElement,
                                afterSwapCallback: api.hasAttribute(commandElement, 'trigger-after-swap')
                                    ? () => handleTriggerAttribute({value: api.getAttributeValue(commandElement, 'trigger-after-swap')})
                                    : undefined,
                                afterSettleCallback: api.hasAttribute(commandElement, 'trigger-after-settle')
                                    ? () => handleTriggerAttribute({value: api.getAttributeValue(commandElement, 'trigger-after-settle')})
                                    : undefined
                            }
                        );
                    }
                }
            }

            api.triggerEvent(triggeringElement, 'htmx:afterServerCommand', {commandElement: commandElement});

        } catch (error) {
            // Fire the public event for programmatic listeners.
            api.triggerErrorEvent(
                document.body, 'htmx:serverCommandError', {error: error, commandElement: commandElement}
            );
        }
    }

    /**
     * Validate <htmx> element & throw an error for unknown attributes or invalid combinations.
     * @param {HTMLElement} element
     * @throws {Error} If validation fails
     */
    function validateCommandElement(element) {
        const errors = [];

        const hasCommandAttribute = Array.from(element.attributes).some(attr => ATTRIBUTES.has(attr.name));
        if (!hasCommandAttribute) {
            const elementHTML = element.outerHTML.replace(/\s*\n\s*/g, " ").trim();
            throw new Error(`[server-commands] The following <htmx> tag has no command attributes:\n\n  ${elementHTML}\n`);
        }

        // Check unknown attributes
        for (const attr of element.attributes) {
            if (!ATTRIBUTES.has(attr.name)) {
                errors.push(
                    `Invalid attribute '${attr.name}'. Valid attributes are: ${[...ATTRIBUTES].join(', ')}`
                );
            }
        }

        // Check invalid combinations
        const hasSwapOrSelect = api.hasAttribute(element, 'swap') || api.hasAttribute(element, 'select');
        const hasTarget = api.hasAttribute(element, 'target');
        if (hasSwapOrSelect && !hasTarget) {
            errors.push(
                `A command with 'swap' or 'select' performs a swap and requires a target. Specify the target using the 'target' attribute: <htmx target="#my-div">...</htmx>`
            );
        }

        // If errors were found, throw an error with details
        if (errors.length > 0) {
            const elementHTML = element.outerHTML.replace(/\s*\n\s*/g, " ").trim();
            const errorIntro = `[server-commands] ${errors.length} validation error(s) for command:`;
            const errorDetails = errors.map(e => `  - ${e}`).join('\n');

            throw new Error(`${errorIntro}\n\n  ${elementHTML}\n\n${errorDetails}\n`);
        }
    }

    /**
     * Executes a trigger value. Can be a comma-separated string (e.g. 'itemsUpdated, menuChanged')
     * or a JSON string (e.g. {"showMessage": "Items updated!", "target": "#my-div"}).
     * @param {{value: string}} trigger
     * @see https://htmx.org/headers/hx-trigger/
     */
    function handleTriggerAttribute(trigger) {
        try {
            const triggers = JSON.parse(trigger.value);
            for (const eventName in triggers) {
                let detail = triggers[eventName];
                let target = document.body; // Default target

                if (typeof detail === 'object' && detail !== null && detail.target) {
                    const newTarget = htmx.find(detail.target);
                    if (newTarget) {
                        target = newTarget;
                    } else {
                        console.warn(`[server-commands] Trigger target "${detail.target}" not found.`);
                    }
                    delete detail.target; // Remove target from the detail payload
                }
                api.triggerEvent(target, eventName, detail);
            }
        } catch (e) {
            trigger.value.split(',').forEach(eventName => {
                api.triggerEvent(document.body, eventName.trim());
            });
        }
    }

    /**
     * Handles the location attribute, mimicking the HX-Location response header.
     * @param {string} redirectPath - Can be an URL path (e.g. '/new-path') or a JSON string with options for the htmx.ajax call (e.g. '{"path": "/new-path", "target": "#main", "swap": "innerHTML"}').
     * @see https://htmx.org/headers/hx-location/
     */
    function handleLocationAttribute(redirectPath) {
        api.saveCurrentPageToHistory();

        var redirectSwapSpec = {};

        // If JSON string
        if (redirectPath.indexOf('{') === 0) {
            // Extract path & swap specification (e.g. target, swap, select)
            redirectSwapSpec = JSON.parse(redirectPath);
            redirectPath = redirectSwapSpec.path;
            delete redirectSwapSpec.path;
        }

        htmx.ajax('get', redirectPath, redirectSwapSpec).then(function() {
                api.pushUrlIntoHistory(path);
        });
    }
})();