/**
 * Simple heart demo with selection callback
 * 
 * @class
 * @author Alan Wu
 * @returns {PJP.Main}
 */
Main = function()  {
  
  var selectionCallback = function() {
    return function(event) {
      if (event.eventType === physiomeportal.EVENT_TYPE.SELECTED) {
        if (event.identifiers.length > 0) {
          console.log("selected", event.identifiers);
          
        }
      }
      if (event.eventType === physiomeportal.EVENT_TYPE.HIGHLIGHTED) {
        if (event.identifiers.length > 0) {
          console.log("highlighted", event.identifiers);
        }
      }
    }
  }

  var initialise = function() {
    var modelsLoader = new physiomeportal.ModelsLoader();
    modelsLoader.initialiseLoading();
    var organsViewer = new physiomeportal.OrgansViewer(modelsLoader);
    var organsViewerDialog = new physiomeportal.OrgansViewerDialog(organsViewer);
    var eventNotifier =  new physiomeportal.EventNotifier();
    organsViewer.addNotifier(eventNotifier);
    eventNotifier.suscribe(this, selectionCallback());
    organsViewer.loadOrgans("human", "Cardiovascular", "Heart");
    organsViewerDialog.setWidth("100%");
    organsViewerDialog.setHeight("100%");
    organsViewerDialog.setLeft("0px");
    organsViewerDialog.setTop("0px");
  }

  initialise();
}
