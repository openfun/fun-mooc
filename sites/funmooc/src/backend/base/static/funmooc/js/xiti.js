(function () {
  function SmartTag(metadata) {
    /**
     * 
     * SmartTag
     * An object to install, initialize then use Xiti SmartTag.
     * 
     * @param metadata
     *  site_id Xiti id to identify the site on Analytics Suite
     *  level2 the level2 of the page - an id used by Xiti to group records by root pages
     *  organizations - list of all organizations included on the page
     * 
     */
    this.data = null;
    this.level2 = metadata.level2;
    this.organizations = metadata.organizations;
    this.siteId = metadata.site_id;
    this.tag = null;

    /* Populate the data object sent to Xiti on dispatch
      It includes level2, name and chapters

      To get name and chapters we split the url pathname "/"
      name is the first element of this destructuring
      chapters are the remaining elements
    */
    this.populateData = function () {
      var self = this;
      var chapters = location.pathname
        .split('/')
        .filter(function (slug) { return slug.length > 0 })
        .slice(1) // Remove lang

      var name = chapters.shift();

      this.data = {
        level2: this.level2,
        name: name || '/',
      }

      chapters.forEach(function (chapter, index) {
        self.data["chapter" + (index + 1)] = '[' + chapter + ']';
      });
    };

    /* Dispatch data on page load

      Set customVars, customObject and internalSearch if it is relevant
      then dispatch a record.
    */
    this.dispatch = function () {
      // Detail language
      var lang = (document.documentElement.lang || '-').split('-')[0].toUpperCase();
      if (lang) {
        this.tag.customVars.set({ site: { 1: '[' + lang + ']' } });
      }

      // Detail organizations related to the page
      if (this.organizations.length > 0) {
        this.tag.page.set({
          customObject: {
            organizations: this.organizations
          }
        });
      }

      // Detail search query if there is
      var search_query = new URL(location.href).searchParams.get('query');
      if (search_query) {
        this.tag.internalSearch.set({
          keyword: search_query,
        });
      }

      // Dispatch data
      this.tag.page.set(this.data)
      this.tag.dispatch();
    }


    /* Instantiate the Xiti tag

       Check if ATInternet exists then create a new tag.
    */
    this.createTag = function () {
      if (ATInternet) {
        this.tag = new ATInternet.Tracker.Tag({ site: this.siteId, secure: true });
      }
    }

    /* Initialize SmartTag

      Load Xiti scripts then dispatch a record and add click listeners on buttons
    */
    this.init = function () {
      var self = this;
      this.load(function () {
        self.dispatch();
        self.spyClickOnButtons();
      })
    }

    /* Load Xiti scripts on the page

      Dynamicaly load scripts required by Xiti only if needed
    */
    this.load = function (onload) {
      var self = this;
      var script = document.createElement('script');
      script.type = "text/javascript";
      script.async = true;
      script.onload = function () {
        self.createTag();
        self.populateData();
        onload && onload();
      };
      script.onerror = function (error) { throw error };
      script.src = "https://tag.aticdn.net/" + this.siteId + "/smarttag.js"
      document.body.append(script)
    };

    /* Add click event listeners on all buttons on the page

      Send a record each time a visitor click on an action button on the page.
    */
    this.spyClickOnButtons = function () {
      var self = this;

      function spyClick(event) {
        var $target = event.currentTarget;
        var name = $target.innerText || $target.classList.value.replace(' ', '.');

        var parameters = self.data;
        parameters.elem = $target;
        parameters.name = name;
        parameters.type = 'action';

        self.tag.click.send(parameters);
      }

      document.getElementsByTagName('button').forEach(function ($button) {
        $button.addEventListener('click', spyClick, false);
      });
    }
  }

  if (!!window.__funmooc_marketing_context__.xiti.site_id) {
    var smartTag = new SmartTag(__funmooc_marketing_context__.xiti);
    smartTag.init();
  }
})();

