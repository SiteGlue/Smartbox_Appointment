// external packages
const express = require('express');
require('dotenv').config();

// Start the webapp
const webApp = express();

// Webapp settings
webApp.use(express.urlencoded({
    extended: true
}));
webApp.use(express.json());

// Server Port
const PORT = process.env.PORT || 5000;

// Home route
webApp.get('/', (req, res) => {
    res.send(`Hello World.!`);
});

// create utterance transcript
const utteranceTranscript = (req, flag, oc = '') => {

    let fulfillmentText = '';
    let queryText = '';
    let transcript = [];
    let session = '';

    if (!flag) {
        fulfillmentText += req.body.queryResult.fulfillmentText;
        queryText += req.body.queryResult.queryText;

        session += req.body.session;

        let outputContexts = req.body.queryResult.outputContexts;

        outputContexts.forEach(outputContext => {
            let session = outputContext.name;
            if (session.includes('/contexts/session')) {
                if (outputContext.hasOwnProperty('parameters')) {
                    if (outputContext.parameters.hasOwnProperty('transcript')) {
                        transcript = outputContext.parameters.transcript;
                    }
                }
            }
        });
    } else {
        fulfillmentText += req.fulfillmentText;
        queryText += req.queryText;
        session += req.session;
        transcript = req.transcript;
    }

    let date = new Date();

    transcript.push({
        user: `${queryText}\n`,
        SmartBox_Agent: `${fulfillmentText}\n`,
        date: `${date.toLocaleString('en', { timeZone: 'Asia/Kolkata' })}\n`
    });

    let contextName = `${session}/contexts/session`;

    if (oc === '') {
        return {
            fulfillmentText: fulfillmentText,
            outputContexts: [{
                name: contextName,
                lifespanCount: 50,
                parameters: {
                    transcript: transcript
                }
            }]
        };
    } else {
        let outputContext = [];
        outputContext.push({
            name: contextName,
            lifespanCount: 50,
            parameters: {
                transcript: transcript
            }
        });
        oc.forEach(out => {
            outputContext.push(out);
        });
        return {
            fulfillmentText: fulfillmentText,
            outputContexts: outputContext
        };
    }
};

const REGEXP = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const handleLiveChatRequest = (req) => {

    let outputContexts = req.body.queryResult.outputContexts;
    let queryText = req.body.queryResult.queryText;
    let session = req.body.session;

    let first_name, last_name, phone, email, add_info;
    let transcript = [];

    outputContexts.forEach(outputContext => {
        let session = outputContext.name;
        if (session.includes('/contexts/session')) {
            if (outputContext.hasOwnProperty('parameters')) {
                first_name = outputContext.parameters.first_name;
                last_name = outputContext.parameters.last_name;
                phone = outputContext.parameters.phone;
                email = outputContext.parameters.email;
                add_info = outputContext.parameters.add_info;
                transcript = outputContext.parameters.transcript;
            }
        }
    });

    let outString = '';

    if (first_name === undefined) {
        outString += `I did not get your first name. What is your first name?`;
        let awaitFirstnameLCR = `${session}/contexts/await-firstname-lcr`;
        let oc = [{
            name: awaitFirstnameLCR,
            lifespanCount: 1
        }];
        return utteranceTranscript({
            fulfillmentText: outString,
            queryText: queryText,
            session: session,
            transcript: transcript
        }, true, oc);
    } else if (last_name === undefined) {
        outString += `Sound good. ${first_name}!::next-1000::I'll connect you with our staff now.::next-200::To get started, what is your last name?`;
        let awaitLastname = `${session}/contexts/await-lastname`;
        let oc = [{
            name: awaitLastname,
            lifespanCount: 1
        }];
        return utteranceTranscript({
            fulfillmentText: outString,
            queryText: queryText,
            session: session,
            transcript: transcript
        }, true, oc);
    } else if (email === undefined) {
        outString += `Thanks ${first_name}!::next-1000::We can also follow up by email.::next-1000::What is your email address?`;
        let awaitEmail = `${session}/contexts/await-email`;
        let oc = [{
            name: awaitEmail,
            lifespanCount: 1
        }];
        return utteranceTranscript({
            fulfillmentText: outString,
            queryText: queryText,
            session: session,
            transcript: transcript
        }, true, oc);
    } else if (phone === undefined) {
        if (!REGEXP.test(email.toLowerCase())) {
            outString += `Please enter a valid email address or enter Skip to continue.`;
            let awaitEmail = `${session}/contexts/await-email`;
            let oc = [{
                name: awaitEmail,
                lifespanCount: 1
            }];
            return utteranceTranscript({
                fulfillmentText: outString,
                queryText: queryText,
                session: session,
                transcript: transcript
            }, true, oc);
        } else {
            outString += `What is the best phone number to reach you?`;
            let awaitPhone = `${session}/contexts/await-phone`;
            let oc = [{
                name: awaitPhone,
                lifespanCount: 1
            }];
            return utteranceTranscript({
                fulfillmentText: outString,
                queryText: queryText,
                session: session,
                transcript: transcript
            }, true, oc);
        }
    } else if (add_info === undefined) {
        // validate the phone number
        if (String(phone).length < 10) {
            outString += `Please enter a valid 10 digit phone number.`;
            let awaitPhone = `${session}/contexts/await-phone`;
            let oc = [{
                name: awaitPhone,
                lifespanCount: 1
            }];
            return utteranceTranscript({
                fulfillmentText: outString,
                queryText: queryText,
                session: session,
                transcript: transcript
            }, true, oc);
        } else {
            outString += `Finally, do you have any additional details for our support team? Please provide it here.`;
            let awaitAdditionalInfo = `${session}/contexts/await-additional-info`;
            let oc = [{
                name: awaitAdditionalInfo,
                lifespanCount: 1
            }];
            return utteranceTranscript({
                fulfillmentText: outString,
                queryText: queryText,
                session: session,
                transcript: transcript
            }, true, oc);
        }
    } else {
        outString += `I'll connect you with our staff now.::next-2000::Please standby to chat live or call <%phone%> for immediate assistance.`;
        let operatorRequest = `${session}/contexts/OPERATOR_REQUEST`;
        let oc = [{
            name: operatorRequest,
            lifespanCount: 1
        }];
        return utteranceTranscript({
            fulfillmentText: outString,
            queryText: queryText,
            session: session,
            transcript: transcript
        }, true, oc);
    }
};

const handleNewClientCallbackRequest = (req) => {

    let outputContexts = req.body.queryResult.outputContexts;
    let queryText = req.body.queryResult.queryText;
    let session = req.body.session;

    let first_name, last_name, phone, email, add_info;
    let transcript = [];

    outputContexts.forEach(outputContext => {
        let session = outputContext.name;
        if (session.includes('/contexts/session')) {
            if (outputContext.hasOwnProperty('parameters')) {
                first_name = outputContext.parameters.first_name;
                last_name = outputContext.parameters.last_name;
                phone = outputContext.parameters.phone;
                email = outputContext.parameters.email;
                add_info = outputContext.parameters.add_info;
                transcript = outputContext.parameters.transcript;
            }
        }
    });

    let outString = '';

    if (first_name === undefined) {
        outString += `I did not get your first name. What is your first name?`;
        let awaitFirstnameNCCR = `${session}/contexts/await-firstname-nccr`;
        let oc = [{
            name: awaitFirstnameNCCR,
            lifespanCount: 1
        }];
        return utteranceTranscript({
            fulfillmentText: outString,
            queryText: queryText,
            session: session,
            transcript: transcript
        }, true, oc);
    } else if (last_name === undefined) {
        outString += `Ok ${first_name}, I'll have a customer support agent call you ASAP. ::next-2000::To get started, what is your last name?`;
        let awaitLastnameNCCR = `${session}/contexts/await-lastname-nccr`;
        let oc = [{
            name: awaitLastnameNCCR,
            lifespanCount: 1
        }];
        return utteranceTranscript({
            fulfillmentText: outString,
            queryText: queryText,
            session: session,
            transcript: transcript
        }, true, oc);
    } else if (phone === undefined) {
        outString += `Thanks ${first_name}! ::next-1000::We can also follow up by phone.::What is the best phone number to reach you?`;
        let awaitPhoneNCCR = `${session}/contexts/await-phone-nccr`;
        let oc = [{
            name: awaitPhoneNCCR,
            lifespanCount: 1
        }];
        return utteranceTranscript({
            fulfillmentText: outString,
            queryText: queryText,
            session: session,
            transcript: transcript
        }, true, oc);
    } else if (email === undefined) {
        // validate the phone number
        if (String(phone).length < 10) {
            outString += `Please enter a valid 10 digit phone number.`;
            let awaitPhoneNCCR = `${session}/contexts/await-phone-nccr`;
            let oc = [{
                name: awaitPhoneNCCR,
                lifespanCount: 1
            }];
            return utteranceTranscript({
                fulfillmentText: outString,
                queryText: queryText,
                session: session,
                transcript: transcript
            }, true, oc);
        } else {
            outString += `What is your email address?`;
            let awaitEmailNCCR = `${session}/contexts/await-email-nccr`;
            let oc = [{
                name: awaitEmailNCCR,
                lifespanCount: 1
            }];
            return utteranceTranscript({
                fulfillmentText: outString,
                queryText: queryText,
                session: session,
                transcript: transcript
            }, true, oc);
        }
    } else if (add_info === undefined) {
        // validate email address
        if (!REGEXP.test(email.toLowerCase())) {
            outString += `Please enter a valid email address or enter Skip to continue.`;
            let awaitEmailNCCR = `${session}/contexts/await-email-nccr`;
            let oc = [{
                name: awaitEmailNCCR,
                lifespanCount: 1
            }];
            return utteranceTranscript({
                fulfillmentText: outString,
                queryText: queryText,
                session: session,
                transcript: transcript
            }, true, oc);
        } else {
            outString += `Finally, do you have any additional details for our support team? Please provide it here.`;
            let awaitAdditionalInfoNCCR = `${session}/contexts/await-additional-info-nccr`;
            let oc = [{
                name: awaitAdditionalInfoNCCR,
                lifespanCount: 1
            }];
            return utteranceTranscript({
                fulfillmentText: outString,
                queryText: queryText,
                session: session,
                transcript: transcript
            }, true, oc);
        }
    } else {
        outString += `You are all set! A customer support agent will be in touch ASAP. Is there anything else I can help you with? <button type="button" class"quick_reply">Disconnect</button>`;
        return utteranceTranscript({
            fulfillmentText: outString,
            queryText: queryText,
            session: session,
            transcript: transcript
        }, true);
    }
};

const handleSmartchatDemoRequest = (req) => {

    let outputContexts = req.body.queryResult.outputContexts;
    let queryText = req.body.queryResult.queryText;
    let session = req.body.session;

    let first_name, last_name, phone, email, type, company;
    let transcript = [];

    outputContexts.forEach(outputContext => {
        let session = outputContext.name;
        if (session.includes('/contexts/session')) {
            if (outputContext.hasOwnProperty('parameters')) {
                first_name = outputContext.parameters.first_name;
                last_name = outputContext.parameters.last_name;
                phone = outputContext.parameters.phone;
                email = outputContext.parameters.email;
                type = outputContext.parameters.type;
                company = outputContext.parameters.company;
                transcript = outputContext.parameters.transcript;
            }
        }
    });

    let outString = '';

    if (first_name === undefined) {
        outString += `I did not get your first name. What is your first name?`;
        let awaitFirstnameSDR = `${session}/contexts/await-firstname-sdr`;
        let oc = [{
            name: awaitFirstnameSDR,
            lifespanCount: 1
        }];
        return utteranceTranscript({
            fulfillmentText: outString,
            queryText: queryText,
            session: session,
            transcript: transcript
        }, true, oc);
    } else if (type === undefined) {
        outString += `Great. I can help you schedule a demo of our SmartChat messaging platform.::next-3000::To get started, what are you interested in? <button type="button" class"quick_reply">More Website Leads</button> <button type="button" class"quick_reply">Live Chat for My Website</button><button type="button" class"quick_reply">Improve Customer Service</button><button type="button" class"quick_reply">SiteGlue Partner Program</button>%disable`;
        let awaitTypeSDR = `${session}/contexts/await-type-sdr`;
        let oc = [{
            name: awaitTypeSDR,
            lifespanCount: 1
        }];
        return utteranceTranscript({
            fulfillmentText: outString,
            queryText: queryText,
            session: session,
            transcript: transcript
        }, true, oc);
    } else if (last_name === undefined) {
        outString += `Sounds good. We're glad you're here!::next-2000::I just need to get your contact information so we can schedule your demo at a time that works for you. ::next-1000::What is your last name?`;
        let awaitLastnameSDR = `${session}/contexts/await-lastname-sdr`;
        let oc = [{
            name: awaitLastnameSDR,
            lifespanCount: 1
        }];
        return utteranceTranscript({
            fulfillmentText: outString,
            queryText: queryText,
            session: session,
            transcript: transcript
        }, true, oc);
    } else if (phone === undefined) {
        outString += `What is the best number to reach you?`;
        let awaitPhoneSDR = `${session}/contexts/await-phone-sdr`;
        let oc = [{
            name: awaitPhoneSDR,
            lifespanCount: 1
        }];
        return utteranceTranscript({
            fulfillmentText: outString,
            queryText: queryText,
            session: session,
            transcript: transcript
        }, true, oc);
    } else if (email === undefined) {
        // if the phone number does not have ten digits
        if (String(phone).length < 10) {
            outString += `Please enter a valid 10 digit phone number.`;
            let awaitPhoneSDR = `${session}/contexts/await-phone-sdr`;
            let oc = [{
                name: awaitPhoneSDR,
                lifespanCount: 1
            }];
            return utteranceTranscript({
                fulfillmentText: outString,
                queryText: queryText,
                session: session,
                transcript: transcript
            }, true, oc);
        } else {
            outString += `Finally, what is your email address for the appointment confirmation?`;
            let awaitEmailSDR = `${session}/contexts/await-email-sdr`;
            let oc = [{
                name: awaitEmailSDR,
                lifespanCount: 1
            }];
            return utteranceTranscript({
                fulfillmentText: outString,
                queryText: queryText,
                session: session,
                transcript: transcript
            }, true, oc);
        }
    } else if (company === undefined) {
        // Verify email address
        if (!REGEXP.test(email.toLowerCase())) {
            outString += `Please enter a valid email address or enter Skip to continue.`;
            let awaitEmailSDR = `${session}/contexts/await-email-sdr`;
            let oc = [{
                name: awaitEmailSDR,
                lifespanCount: 1
            }];
            return utteranceTranscript({
                fulfillmentText: outString,
                queryText: queryText,
                session: session,
                transcript: transcript
            }, true, oc);
        } else {
            outString += `What is the name of your company?.`;
            let awaitCompanySDR = `${session}/contexts/await-company-sdr`;
            let oc = [{
                name: awaitCompanySDR,
                lifespanCount: 1
            }];
            return utteranceTranscript({
                fulfillmentText: outString,
                queryText: queryText,
                session: session,
                transcript: transcript
            }, true, oc);
        }
    }
    else {
        outString += `Thanks ${first_name}!::next-1000::We'll be in touch shortly to schedule your SmartChat platform demo.<button type="button" class"quick_reply">Disconnect</button>`;
        return utteranceTranscript({
            fulfillmentText: outString,
            queryText: queryText,
            session: session,
            transcript: transcript
        }, true);
    }
};

// Webhook route
webApp.post('/webhook', async (req, res) => {

    let action = req.body.queryResult.action;
    let session = req.body.session;
    console.log('Webhook called.');
    console.log(`Action --> ${action}`);
    console.log(`Session --> ${session}`);

    let responseData = {};

    if (action === 'handleLiveChatRequest') {
        responseData = handleLiveChatRequest(req);
    } else if (action === 'handleNewClientCallbackRequest') {
        responseData = handleNewClientCallbackRequest(req);
    } else if (action === 'handleSmartchatDemoRequest') {
        responseData = handleSmartchatDemoRequest(req);
    } else if (action === 'utteranceTranscript') {
        responseData = utteranceTranscript(req);
    } else {
        responseData = {
            fulfillmentText: 'No action is set for this intent.'
        };
    }

    res.send(responseData);
});

// Start the server
webApp.listen(PORT, () => {
    console.log(`Server is up and running at ${PORT}`);
});