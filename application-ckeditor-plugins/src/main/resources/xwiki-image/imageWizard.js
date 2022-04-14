/*
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 */

/**
 * Append a message to the specified location. Remove the message after a delay.
 */
define('imageNotification', ['jquery'], function($) {
  'use strict';

  return function(message, location, type) {
    var delay = 5000;
    if (type === 'error') {
      delay = 10000;
    }
    var content = $("<div class='xnotification-wrapper'/>")
      .append($("<div class='xnotification xnotification-" + type + "'/>")
        .append(message));
    location.append(content).delay(delay).queue(function() {
      content.replaceWith('');
    });
  };
});


define('imageWizard', ['imageSelector', 'imageEditor'], function(imageSelector, imageEditor) {
  'use strict';

  function backToSelectionOrFinish(data) {
    if (data.action === 'selectImage') {
      return selectAndEdit(data);
    } else {
      return data;
    }
  }

  function editOnly(params) {
    return imageEditor(params)
      .then(backToSelectionOrFinish);
  }

  function selectAndEdit(params) {
    params = params || {};
    params.newImage = true;
    return imageSelector(params)
      .then(imageEditor)
      .then(backToSelectionOrFinish);
  }

  return function(params) {
    if (params.imageData && params.imageData.resourceReference) {
      return editOnly(params);
    } else {
      return selectAndEdit(params);
    }
  };
});
