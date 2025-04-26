// Main Controller
//
// Made with Easy Lens

//@input Component.ScriptComponent happyText
//@input Component.ScriptComponent faceEvents


try {

script.happyText.enabled = false;
script.faceEvents.onSmileStarted.add(function() { script.happyText.enabled = true; });
script.faceEvents.onSmileFinished.add(function() { script.happyText.enabled = false; });

} catch(e) {
  print("error in controller");
  print(e);
}
