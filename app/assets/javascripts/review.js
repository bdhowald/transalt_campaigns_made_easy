'use strict'

var onReviewPageLoad = function(){

  var that = this;

  initialize();

  /**
   * Sets up all js functions on this page.
   * @name initialize
   */
  function initialize(){
    setUpGoogleListeners();
    that.googlePlaceSelected = checkAddressFields();

    that.tracker             = window.tracker;
  }


  $('body').on('click', 'a.information-toggle', function(event){
    // Expand a campaign's description.
    toggleTargetDetails(event);

    return false;
  })


  $('body').on('submit', '#user-form', function(){
    // Gather ids of campaigns to sign and serialize them for submission.
    gatherCampaignIdsForSubmission();
  })


  $('body').on('click', 'div.read-more', function(event){
    // Show the full petition letter of a campaign.
    showFullLetter(event)

    return false;
  })

  $('body').on('submit', '#user-form', function(event){
    // Validate the user form.
    validateForm(event);
  })


  /**
   * If user address info is complete, a Google place has been selected.
   * @name  checkAddressFields
   */
  function checkAddressFields(){
    if ($('#user-address-street').val() === '') return false
    if ($('#user-address-city').val()   === '') return false
    if ($('#user-address-state').val()  === '') return false
    if ($('#user-address-zip').val()    === '') return false

    return true
  }


  /**
   * Make sure user selects a location through Google Places.
   * @name  ensureGooglePlaceSelected
   */
  function ensureGooglePlaceSelected(){
    var input = $('#user-address')[0];
    var $input = $('#user-address');

    if (!that.googlePlaceSelected) {
      input.setCustomValidity('You must select an address');
      $input.siblings('.invalid-feedback').text('You must select an address');
      return false
    } else {
      input.setCustomValidity('');
      $input.siblings('.invalid-feedback').text('Please enter your address');
      return true
    }

  }


  /**
   * Ensure campaign ids to sign are serialized in hidden input for submission.
   * @name gatherCampaignIdsForSubmission
   */
  function gatherCampaignIdsForSubmission(){
    var campaignIds = $('li.campaign').not('.signed').map(function() {
      return $(this).data('campaign-id')
    })
    $('#petition-data').val(JSON.stringify(campaignIds.get()));
  }


  /**
   * When the user selects a place, let's track it.
   * @name  handleDetailsResult
   * @param {Object} location - Google place object
   * @param {string} granularity - honestly I don't know.
   */
  function handleDetailsResult(location, granularity){
    console.log(
      "We selected the first item from the list automatically " +
      "because the user didn't select anything"
    );
    console.log(location);

  }


  /**
   * When the user selects a place, we need to determine the granularity, track it, and recenter the map.
   * @name  handleLocationSelection
   * @param {Object} location - Google place object
   * @param {string} status - status of request, honestly I don't know.
   */
  function handleLocationSelection(location, status){
    // Change search bar location to address.
    $('#user-address').val(location.formatted_address);

    // Set flag to signal user has selected a place.
    that.googlePlaceSelected = true;

    // Set hidden address inputs
    setSelectedLocation(location);

    // Track location selection.
    // handleDetailsResult(location, granularity);

    // Validate location form input
    ensureGooglePlaceSelected();

  }

  /**
   * Determines the user's place selection if they click enter instead of clicking on a place.
   * @name  inferUserChoice
   * @param {object} result - Google place object
   */
  function inferUserChoice(result){
    var _this = this;

    var input = $('#user-address')[0];

    // Do the google search, and pass it in a callback (last arg).
    performGoogleSearch(result, input, handleLocationSelection);
  }


  /**
   * Code that obtains google geocoded data from a text search for a place.
   * @name  performGoogleSearch
   * @param {object} place - Google place object
   * @param {object} input - address field object
   * @param {requestCallback} callback - callback to trigger on place selection.
   */
  function performGoogleSearch(place, input, callback){
    if (place.name != ""){
      // The user pressed enter in the input
      // without selecting a result from the list
      // Let's get the list from the Google API so that
      // we can retrieve the details about the first result
      // and use it (just as if the user had actually selected it)
      var autocompleteService = new google.maps.places.AutocompleteService();
      autocompleteService.getPlacePredictions(
        {
          'input':  place.name,
          'offset': place.name.length,
          // I repeat the options for my AutoComplete here to get
          // the same results from this query as I got in the
          // AutoComplete widget
          'componentRestrictions': {'country': 'us'},
          'types': ['geocode'],
          'key': 'AIzaSyDfamJ3i1uM6Yc61FW0HeaKCRlE-imBH8U'
        },
        function (list, status){
          if(list == null || list.length == 0) {
            // There are no suggestions available.
            // The user saw an empty list and hit enter.
            console.log("No results");
            resetAddressFields();
          } else {
            // Here's the first result that the user saw
            // in the list. We can use it and it'll be just
            // as if the user actually selected it
            // themselves. But first we need to get its details
            // to receive the result on the same format as we
            // do in the AutoComplete.
            var placesService = new google.maps.places.PlacesService(input);
            placesService.getDetails(
              {'reference': list[0].reference},
              function(detailsResult, placesServiceStatus){
                if (callback != null) {
                  callback(detailsResult, placesServiceStatus);
                }
              }
            )
          }
        }
      )
    }
  }


  /**
   * Reset input fields when no Google place is selected.
   * @name resetAddressFields
   */
  function resetAddressFields(){
    $('#user-address-street').val('');
    $('#user-address-city').val('');
    $('#user-address-state').val('');
    $('#user-address-zip').val('');

    // Set flag to signal user no longer has a selected place.
    that.googlePlaceSelected = false;
  }


  /**
   * Sets hidden address fields on place selection.
   * @name  setSelectedLocation
   * @param {Object} place - Google Places object
   */
  function setSelectedLocation(place){

    if (typeof place !== "undefined" && place !== null) {

      if (place.address_components != null){

        // Set the address
        var street_number = place.address_components.filter(function(component,i){
          return component.types[0] == "street_number"
        });
        var route = place.address_components.filter(function(component,i){
          return component.types[0] == "route"
        });

        if (street_number[0] != null && route[0] != null){
          $('#user-address-street').val([street_number[0].long_name, route[0].long_name].join(' '));
        }

        // set the city
        var city = place.address_components.filter(function(component,i){
          return component.types[0] == "locality";
        });
        if (city[0] != null){
          $('#user-address-city').val(city[0].long_name);
        }

        // In New York, look for boroughs
        var borough = place.address_components.filter(function(component,i){
          return component.types[0] == "sublocality_level_1";
        });
        if (borough[0] != null){
          $('#user-address-city').val(borough[0].long_name);
        }

        // set the region/state
        var region = place.address_components.filter(function(component,i){
          return component.types[0] == "administrative_area_level_1";
        });
        if (region[0] != null){
          $('#user-address-state').val(region[0].short_name);
        }

        // Look for a postal_code
        var postal_code = place.address_components.filter(function(component,i){
          return component.types[0] == "postal_code";
        });
        if (postal_code[0] != null){
          $('#user-address-zip').val(postal_code[0].short_name);
        }

      }
    }
  }



  /**
   * Set up google event listeners.
   * @name  setUpGoogleListeners
   */
  function setUpGoogleListeners(){
    var options = {
      types: ['geocode'],//['(cities)']
      componentRestrictions: {country: 'us'}
    }

    // Typeahead input
    var input = $('#user-address')[0];

    // If the input exists
    if (input && typeof(google) != 'undefined') {
      var autocomplete = new google.maps.places.Autocomplete(input, options);

      // attach event listener.
      google.maps.event.addListener(autocomplete, 'place_changed', function(){

        var result = autocomplete.getPlace();

        if (result.address_components == null){
          // If user didn't pick a place, choose one from the list.
          console.log("User did not click on an option");
          inferUserChoice(result);
        } else {
          // Handle user's choice.
          handleLocationSelection(result, null);
        }
      });

      input.addEventListener('change', function (event) {
        // If user changes input, reset hidden address fields
        resetAddressFields();
      })

      // Make sure a google place has been selected on form submission
      var form = $('#user-form')[0];

      form.addEventListener("submit", function (event) {
        ensureGooglePlaceSelected();
      }, false);

    }

  }


  /**
   * Shows the full letter when user clicks 'read more'
   * @name  showFullLetter
   * @param {Object} event - jQuery event object
   */
  function showFullLetter(event) {
    var $readMoreLink     = $(event.target);

    var $thisCampaign     = $readMoreLink.parents('li.campaign');

    var $thisPetitionText = $readMoreLink.parents('.petition-text');
    var $thisBlockquote   = $thisPetitionText.find('blockquote.blockquote');

    $thisBlockquote.html($thisBlockquote.data('full-letter'));

    // Trackasaurus
    that.tracker.track('Campaign full letter viewed', {campaignID: $thisCampaign.data('campaign-id')});

    // hide '(read more)'
    $readMoreLink.hide();
   }


  /**
   * Hides petition text and targets list for all campaigns except the selected one.
   * @name  toggleTargetDetails
   * @param {Object} event - jQuery event of click on link header for selected campaign.
   */
  function toggleTargetDetails(event) {
    var $toggleLink             = $(event.target);
    var $allCampaigns           = $toggleLink.parents('div.all-campaigns');

    var $thisCampaign           = $toggleLink.parents('li.campaign');
    var $thisCampaignsDetails   = $thisCampaign.find('.petition-details');


    if ($allCampaigns.find('li.campaign').length > 1) {
      // If we have more than one campaign

      var $allToggleLinks       = $allCampaigns.find('a.information-toggle');
      var $allCampaignsDetails  = $allCampaigns.find('.petition-details');
      var $allPetitionTexts     = $('div.petition-text');

      // var $allCampaignsNames    = $allCampaigns.find('.campaign-name');
      // var $thisCampaignsName    = $thisCampaign.find('.campaign-name');

      // Trackasaurus
      that.tracker.track('Campaign details viewed', {campaignID: $thisCampaign.data('campaign-id')});


      if ($thisCampaignsDetails.hasClass('d-none')) {
        // If this campaign's details are hidden, hide those for other campaigns.
        $allCampaignsDetails
          .addClass('d-none')

        // Show this campaign's details.
        $thisCampaignsDetails
          .removeClass('d-none')
      } else {
        // If this campaign's details are visible, hide them.
        $thisCampaignsDetails
          .addClass('d-none')
      }

      $allPetitionTexts.each(function(){
        // Find all blockQuotes...
        var $thisBlockquote = $(this).find('blockquote.blockquote');

        // Replace text with shortened text
        $thisBlockquote.html($thisBlockquote.data('shortened-letter'));

        // Show the 'read more' link, if one exists
        $(this).find('div.read-more').show();
      })

    } else {

      if ($thisCampaignsDetails.hasClass('d-none')) {

        // If we only have one campaign, always show it
        $thisCampaignsDetails
          .removeClass('d-none')
      }

    }

  }


  /**
   * Validates form and stops event propogation if invalid
   * @name  validateForm
   * @param {Object} event -  jQuery form submission event.
   */
  function validateForm(event) {

    var form = event.target;

    if (!form.checkValidity()) {
      // If form is invalid...
      event.preventDefault();
      event.stopPropagation();

      $('input:invalid, select:invalid').each(function(){
        var errorMessage = $(this).siblings('.invalid-feedback');
        var errorMessageContent = errorMessage.html();

        $(this).attr('aria-invalid', 'true');

        errorMessage.replaceWith(
          "<div class='invalid-feedback' role='alert'>" + errorMessageContent + '</div>'
        )

        var errorMessage = $(this).siblings('.invalid-feedback');
        errorMessage.attr('aria-live', 'polite');
      });
      $('input:valid, select:invalid').each(function(){
        var errorMessage = $(this).siblings('.invalid-feedback');

        $(this).attr('aria-invalid', 'false');
        errorMessage.removeAttr('aria-live');
      });
    } else {
      // If form is valid...
      var $submitFormButton = $('#submit-form-button');

      // Disable form submission button
      $submitFormButton.prop('disabled', true);

      // Hide button text and show loading indicator.
      $submitFormButton.find('#submit-button-text').hide();
      $submitFormButton.find('i.zmdi').show();

      // Show screen readers that button has been pressed.
      $submitFormButton.attr('aria-pressed', true);

      var petitionsToSign = $('input#petition-data').val();
      if (petitionsToSign != '') {
        var campaignIDs = JSON.parse(petitionsToSign);

        // Trackasaurus
        that.tracker.track('User attempted to sign campaigns', {campaignIDs: campaignIDs});

      }
    }
    form.classList.add('was-validated');

  };

}

$(document).on("turbolinks:load", onReviewPageLoad)