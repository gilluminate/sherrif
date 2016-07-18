var prompt = require('prompt');
var execFileSync = require('child_process').execFileSync;
var spawnSync = require('child_process').spawnSync;
var colors = require("colors/safe");
var filessystem = require('fs');

prompt.start();

var usernamePrompt = {
    name: 'username',
    message: colors.yellow("Enter a username"),
    validator: /^[a-zA-Z0-9-]+$/m,
    warning: 'Username may only contain letters, numbers, and dashes',
    required: true
};
prompt.get(usernamePrompt, function (err, result) {
    if(validate(result.username)){
        newUser(result.username);
    }
});

function validate(username){
    var valid = true;
    switch (username) {
        case 'root':
            valid = false;
            console.log(colors.red("nice try, h4xx0r"));
            break;
        case '':
            valid = false;
            console.log(colors.magenta("please specify a username to be created"));
            break;
    }

    if(valid) {
        try {
            console.log("checking if username exists...");
            var existsCheck = execFileSync('id', [username]).toString();
            console.log(colors.magenta("user exists"));
            console.log(colors.green(existsCheck));
            valid = false;
            removeCheck(username);
        } catch (err) {
            if(err.toString().indexOf('no such user')>-1){
                valid = true;
            } else {
                valid = false;
                console.log(err.stack);
            }
        }
    }
    return valid;
}

function newUser(newname){
    console.log("Creating jailed user "+colors.yellow(newname)+"...");
    spawnSync('adduser', [newname, '--ingroup', 'sftponly', '--shell', '/bin/false'], { stdio: "inherit", stdin: "inherit" });
    filessystem.mkdirSync("/home/"+newname+"/www");
    execFileSync('chown', ['-R', 'root:root', '/home/'+newname]);
    filessystem.mkdirSync("/var/www/jailed/"+newname);
    filessystem.mkdirSync("/var/www/jailed/"+newname+"/www");
    execFileSync('chown', ['-R', newname+':sftponly', '/var/www/jailed/'+newname+'/www']);
    execFileSync('mount', ['--bind', '/var/www/jailed/'+newname+'/www', '/home/'+newname+'/www']);
    filessystem.appendFileSync('/etc/fstab', "/var/www/jailed/"+newname+"/www /home/"+newname+"/www    none    bind");
    console.log("Done.");
}

function removeCheck(oldname){
    var removePrompt = {
        name: 'yesno',
        message: colors.magenta('Would you like to permanently remove '+colors.red(oldname)+'?'),
        validator: /^y[es]*|n[o]?$/im,
        warning: 'Must respond yes or no',
        default: 'no'
    };
    prompt.get(removePrompt, function (err, result) {
        if(result.yesno.indexOf('y')>-1){
            removeUser(oldname);
        }
    });
}

function removeUser(oldname){
    execFileSync('umount', ['/home/'+oldname+'/www']);
    var backupPrompt = {
        name: 'backup',
        message: colors.magenta('Would you like to backup '+colors.red(oldname)+'\'s files before deleting?'),
        validator: /^y[es]*|n[o]?$/im,
        warning: 'Must respond yes or no',
        default: 'yes'
    };
    prompt.get(backupPrompt, function (err, result) {
        console.log("Removing jailed user "+colors.yellow(oldname)+"...");
        if(result.backup.indexOf('y')>-1){
            execFileSync('deluser', [oldname, '--remove-all-files', '--backup', '--backup-to', '~/user_backups']);
        } else {
            execFileSync('deluser', [oldname, '--remove-all-files']);
        }
	execFileSync('rm', ['-rf', '/home/'+oldname+'/']);
        console.log(colors.blue("Remember to remove mount from /etc/fstab."));
        console.log("Done.");
        execFileSync('rm', ['-rf', '/var/www/jailed/'+oldname+'/']);
    });
}

