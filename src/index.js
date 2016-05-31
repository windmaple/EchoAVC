/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/**
 * This simple sample has no external dependencies or session management, and shows the most basic
 * example of how to create a Lambda function for handling Alexa Skill requests.
 *
 * Examples:
 * One-shot model:
 *  User: "Alexa, ask AVC to read a post"
 *  Alexa: "New article: ..."
 */

/**
 * App ID for the skill
 */
var APP_ID = "amzn1.echo-sdk-ams.app.d0dd1b18-30b9-4a4b-8f20-256ba64abcae";

var FeedParser = require('feedparser')
    , request = require('request')
    , htmlToText = require('html-to-text');

var AlexaSkill = require('./AlexaSkill');

var AVC = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
AVC.prototype = Object.create(AlexaSkill.prototype);
AVC.prototype.constructor = AVC;

AVC.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("AVC onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

AVC.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("AVC onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    handleNewReadRequest(response);
};

/**
 * Overridden to show that a subclass can override this function to teardown session state.
 */
AVC.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("AVC onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

AVC.prototype.intentHandlers = {
    "ReadNewBlogIntent": function (intent, session, response) {
        handleNewReadRequest(response);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        response.ask("You can ask AVC to read a post from Fred Wilson's blog or, you can say exit... What can I help you with?", "What can I help you with?");
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    }
};

function handleNewReadRequest(response) {

    var req = request('http://feeds.feedburner.com/avc')
      , feedparser = new FeedParser()
      , speechOutput = '';
    
    req.on('error', function (error) {
      // handle any request errors
      console.error('Web request errored out');
      response.tell('Sorry. I had some issue accessing AVC! Please try again later.');
    });
    
    req.on('response', function (res) {
      var stream = this;
    
      if (res.statusCode != 200) 
      
      return this.emit('error', new Error('Bad status code'));
    
      stream.pipe(feedparser);
    });
    
    
    feedparser.on('error', function(error) {
      // always handle errors
      console.error('Web request errored out');
      response.tell('Sorry. I had some issue accessing AVC! Please try again later.');
    });

    feedparser.on('readable', function() {
     if (speechOutput) return;
      var stream = this
        , item;
    
      while (item = stream.read()) {
        speechOutput = speechOutput + 'New article: ' + item.title + '. ';
        speechOutput = speechOutput + htmlToText.fromString(item.description).replace(/\[.*\]/g, '') + '\n';
      }

      response.tell(speechOutput);
    });
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    try {
     if (event.session.application.applicationId !== APP_ID) {
        context.fail("Invalid Application ID");
      }
      var avc = new AVC();
      avc.execute(event, context);
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

