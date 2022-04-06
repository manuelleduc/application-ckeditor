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
 * Utility module to load required skin extensions.
 * FIXME: duplicated from xwiki-macro.
 */
define('xwiki-skinx', ['jquery'], function($) {
  $.fn.loadRequiredSkinExtensions = function(requiredSkinExtensions) {
    return this.each(function() {
      // 'this' can be an element, the window or the document itself.
      var ownerDocument = this.ownerDocument || this.document || this;
      var head = $(ownerDocument).find('head');
      var existingSkinExtensions;
      var getExistingSkinExtensions = function() {
        return head.find('link, script').map(function() {
          return $(this).attr('href') || $(this).attr('src');
        }).get();
      };
      $('<div></div>').html(requiredSkinExtensions).find('link, script').filter(function() {
        if (!existingSkinExtensions) {
          existingSkinExtensions = getExistingSkinExtensions();
        }
        var url = $(this).attr('href') || $(this).attr('src');
        return existingSkinExtensions.indexOf(url) < 0;
      }).appendTo(head);
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
    if (params.macroData && params.macroData.resourceReference) {
      return editOnly(params);
    } else {
      return selectAndEdit(params);
    }
  };
});
