// Preserve sessions and school records while migrating only the school identity.
(() => {
  const name = 'Green Land Model School Jand';
  const address = 'Haji Bazar Chowk, Tehsil Road Jand.';
  window.SCHOOL_BRANDING = Object.freeze({name, address, phone:'+92 300 5203469', logo:'images/logo.jpeg'});
  try {
    const settings = JSON.parse(localStorage.getItem('eduCore_settings') || '{}') || {};
    if (!settings.greenLandBrandingVersion) {
      Object.assign(settings, {schoolName:name, schoolTitle:name, address, schoolAddress:address, phone:'+92 300 5203469', logoDataUrl:'', greenLandBrandingVersion:1});
      localStorage.setItem('eduCore_settings', JSON.stringify(settings));
    }
  } catch (_) { /* The static branding also works when storage is disabled. */ }
})();
