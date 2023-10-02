
let cardNumber = { selector: '#cardNumber', data: '4111 1111 1111 1111', placeholder: '1234 1234 1234 1234' }
let expiryDate = { selector: '#expiryDate', data: '12/23', placeholder: 'ΜΜ / YY' }
let cvv = { selector: '#cvv', data: '123', placeholder: 'CVV' }
let cardHolderName = { selector: '#name', data: 'Test', placeholder: 'Name / Surname' }

let cardData = [cardNumber, expiryDate, cvv, cardHolderName]

module.exports = {

    tags: ['everypay'], '@disabled': false,


    'Check the Successful payment initiation with 3DS': function (browser) {

        const regexReqURL_all = new RegExp(`verifyCardDetails`)

        browser
            .waitForElementVisible('#pay-form') // Pay Form is visible

            .frame('#payForm') // Enter iframe

        for (let i = 0; i < cardData.length; i++) {

            browser
                .verify.attributeContains(cardData[i].selector, 'placeholder', cardData[i].placeholder) // Verify that the placeholder attribute of the card data input has the correct placeholder
                .setValue(cardData[i].selector, cardData[i].data) // set the card data value
        }

        browser
            .waitForElementVisible('button[type="submit"]') // Submit button is visible
            .verify.textEquals('button[type="submit"]', 'Pay 10 €') // Verify that the submit button has the correct text

        checkXHR(browser, regexReqURL_all, 5000, 'button[type="submit"]', 0) // check if verifyCardDetails endpoint return 200

        browser
            .frame(null) // Exit iframe

            .frame('iframe[name="tdsIframe"]') // Enter iframe
            .waitForElementVisible('button[onclick="success"]') // Successful Authentication button is visible
            .verify.textEquals('button[onclick="success"]', 'Successful Authentication') // Veirfy that the Successful Authentication button has the correct text
            .click('button[onclick="success"]') // Click Successful Authentication button
            .frame(null) // Exit iframe

            .waitForElementVisible('body > p') // Body is visible
            .verify.textContains('body > p', 'ctn_') // Verify that the string starts with 'ctn_'
    },

    'Check the Failed payment initiation': function (browser) {

        browser
            .url('file:///C:/Users/Jerry/e2e_tests/tests/everyPaySite.html') // Please download the everyPaySite.html file from the GitHub and add your local path here in order to open the url correctly

            .network.mockResponse('https://sandbox-payform-api.everypay.gr/api/verifyCardDetails', {
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                },
            })

        browser
            .waitForElementVisible('#pay-form') // Pay Form is visible

            .frame('#payForm') // Enter iframe

        for (let i = 0; i < cardData.length; i++) {

            browser
                .verify.attributeContains(cardData[i].selector, 'placeholder', cardData[i].placeholder) // Verify that the placeholder attribute of the card data input has the correct placeholder
                .setValue(cardData[i].selector, cardData[i].data) // set the card data value
        }

        browser
            .waitForElementVisible('button[type="submit"]') // Submit button is visible
            .verify.textEquals('button[type="submit"]', 'Pay 10 €') // Verify that the submit button has the correct text
            .click('button[type="submit"]')

    },

    before: function (browser) {

        browser
            .url('file:///C:/Users/Jerry/e2e_tests/tests/everyPaySite.html') // Please download the everyPaySite.html file from the GitHub and add your local path here in order to open the url correctly

    },

    after: function (browser) {
        browser.end()
    }

}

function checkXHR(browser, urlPattern, timeout, trigger, index, urlExists) {

    browser
        .waitForXHR(urlPattern, timeout, function browserTrigger() {
            browser
                .waitForElementPresent(trigger)
                .click(trigger) // click the trigger to trigger the xhr
        }, (xhrs) => {  // call callback with the first xhr request corresponding to the urlPattern

            // if we don't want the request url to be in the XHR responses and it isn't => pass

            if ((urlExists == false) && (xhrs[index] == undefined)) {
                browser
                    .verify.ok(`Request URL "${urlPattern}" was not found in XHR response!`)
            }

            // else if we don't want the request url to be in the XHR responses but it is => fail and return the control to the main script instead of aborting due to failure

            else if ((urlExists == false) && (xhrs[index] != undefined)) {
                browser
                    .verify.fail(`Request URL "${urlPattern}" was found in XHR response..`)
                    .pause(500)
                return browser
            }

            // else if we want the request url to be in the XHR responses but it isn't => fail and return the control to the main script instead of aborting due to failure

            else if (xhrs[index] == undefined) {

                browser
                    .verify.fail(`Request URL "${urlPattern}" was not found in XHR response..`)
                    .pause(500)
                return browser
            }

            // else we want the request url to be in the XHR response and it is => pass and verify status

            else

                browser
                    .verify.ok(`Request URL "${urlPattern}" was found in XHR response!`)
                    .verify.equal(xhrs[index].status, "success");

            browser
                .verify.equal(xhrs[index].method, "POST")
                .verify.equal(xhrs[index].httpResponseCode, "200")
                .verify.ok(xhrs[index].requestData.length > 0, "request data is populated"); // POST request payload

        })

    return browser

}
