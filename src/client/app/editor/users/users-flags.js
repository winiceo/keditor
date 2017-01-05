/* editor/users/users-flags.js */
editor.once("load", function () {
    'use strict';

    editor.method('users:isBetaTester', function (flag) {
        return (config.self && (config.self.betaTester || config.self.superUser));
    });

    editor.method('users:isSuperUser', function (flag) {
        return (config.self && config.self.superUser);
    });
});

