module.exports = {
  hooks: {
    readPackage(pkg) {
      // Allow @clerk/shared to run postinstall scripts
      if (pkg.name === '@clerk/shared') {
        pkg.hasInstallScript = true;
      }
      return pkg;
    }
  }
};