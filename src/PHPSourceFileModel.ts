import {TextEditor} from 'vscode';
import { Branch, ISourceFileModel, BranchType } from './common';

export class PHPSourceFileModel implements ISourceFileModel{
    private editor: TextEditor = null;
    
    constructor(activeEditor: TextEditor){
        this.editor = activeEditor;
    }

    public getTree(): Branch[]{
        //let phpfile: string = this.editor.document.getText();
        //let classnames: string[] = phpfile.match(/class.*/g);
        /*let branch: Branch = new Branch();

        if(classnames != null && classnames.length > 0){
            if(classnames.length >= 2){
                branch.Type = BranchType.Classes;
                branch.Name = "Classes";
                branch.StartLine = 0;
                branch.EndLine = 0;
                branch.Icon = 1;  
                branch.Nodes = [];
                classnames.forEach(element => {
                    
                });
                this.getChildren2(branch, classnames);
            }
            
        }*/                

        let res: Branch[] = this.getChildren2(null,null);
        //branch.Nodes = this.getChildren(branch.Nodes[0]);
        //res.push(branch);

        return res;
    }
    
    public getChildren(node: Branch): Branch[]{
        return null;
    }

    private getChildren2(node: Branch, itemname: string): Branch[]{
        let phpfile: string = this.editor.document.getText();
        let ifaces:Branch[] = [];
        let classes:Branch[] = [];

        if(node == null){ //--get root
            node = this.InitNewBranch();            
            node.Type = BranchType.Namespace;
            node.Name = "Namespace";            
        }

        switch(node.Type){
            case BranchType.Namespace:
                let namespaces: string[] = phpfile.match(/namespace.*/g);
                if(namespaces != null && namespaces.length > 0){
                    for(var i = 0; i < namespaces.length; i++) {
                        let namespace: string = namespaces[i].replace(/^.*namespace (.*?);/,"$1");
                        if(namespace != namespaces[i]){
                            node.Name = namespace;   
                            break;                         
                        }                   
                    } 
                }                
                let nextBranch: Branch = node;
                if(node.Name != "Namespace"){                    
                    nextBranch = this.InitNewBranch();
                }
                
                nextBranch.Name = "Interfaces";
                nextBranch.Type = BranchType.Interfaces;                                                
                ifaces = this.getChildren2(nextBranch, null);
                
                if(ifaces != [] && ifaces[0].Nodes.length > 0)
                    node.Nodes.concat(ifaces);

                /*nextBranch = node;
                if(node.Name != "Namespace"){                    
                    nextBranch = this.InitNewBranch();
                }*/
                nextBranch.Name = "Classes";
                nextBranch.Type = BranchType.Classes;                                                
                classes = this.getChildren2(nextBranch, null);

                if(classes != [] && classes[0].Nodes.length > 0)
                node.Nodes.concat(classes);

                break;

            case BranchType.Interfaces:
                break;

            case BranchType.Classes:
                let classnames: string[] = phpfile.match(/class .*/g);
                if(classnames != null && classnames.length > 0){
                    for(var i = 0; i < classnames.length; i++) {
                        let nextBranch: Branch = this.InitNewBranch();
                        nextBranch.Name = "Class";
                        nextBranch.Type = BranchType.Class;
                        classes.concat(this.getChildren2(nextBranch, classnames[i]));
                    }                    
                }
                break;

            case BranchType.Class:
                let classname: string = itemname.replace(/^.*class (.*?)/,"$1");
                classname = classname.replace(/^(.*?) extends (.*).*$/,'$1(base: $2)');
                break;
        }

        let res: Branch[] = [];
        /*if(ifaces != [] && ifaces[0].Nodes.length > 0)
            res.concat(ifaces);*/
        if(node != null)
            res.push(node);
        return res;
    } 
    
    private InitNewBranch(): Branch{
        let branch: Branch = new Branch();
        branch.Type = BranchType.None;
        branch.Name = "";
        branch.StartLine = 0;
        branch.EndLine = 0;
        branch.Icon = 0;
        branch.Nodes = [];

        return branch;
    }
}