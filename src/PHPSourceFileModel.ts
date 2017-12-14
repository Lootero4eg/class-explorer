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

        let res: Branch[] = this.getChildren2(null);
        //branch.Nodes = this.getChildren(branch.Nodes[0]);
        //res.push(branch);

        return res;
    }
    
    public getChildren(node: Branch): Branch[]{
        return null;
    }

    private getChildren2(node: Branch): Branch[]{
        let phpfile: string = this.editor.document.getText();
        let ifaces:Branch[] = [];
        let classes:Branch[] = [];
        let consts:Branch[] = [];
        let properties:Branch[] = [];
        let methods:Branch[] = [];
        let res: Branch[] = [];

        let nextBranch: Branch = null;

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
                nextBranch = node;
                if(node.Name != "Namespace"){                    
                    nextBranch = this.InitNewBranch();
                }
                
                nextBranch.Name = "Interfaces";
                nextBranch.Type = BranchType.Interfaces;                                                
                ifaces = this.getChildren2(nextBranch);
                
                if(ifaces != [] && ifaces.length > 0)
                    node.Nodes = node.Nodes.concat(ifaces);
                
                nextBranch.Name = "Classes";
                nextBranch.Type = BranchType.Classes;                                                
                classes = this.getChildren2(nextBranch);

                if(classes != [] && classes.length > 0){                   
                    node.Nodes = node.Nodes.concat(classes);
                }                

                break;

            case BranchType.Interfaces:
                node = null;
                break;

            case BranchType.Classes:
                let cleanText: string = this.ClearComments(phpfile);
                //let classnames: string[] = phpfile.match(/class .*/g);
                let classnames: string[] = cleanText.match(/class .*/g);
                if(classnames != null && classnames.length > 0){
                    for(var i = 0; i < classnames.length; i++) {
                        nextBranch = this.InitNewBranch();
                        nextBranch.Name = "Class";                        
                        nextBranch.Type = BranchType.Class;
                        nextBranch.Icon = 1;
                        nextBranch.SearchPattern = classnames[i];
                        classes = classes.concat(this.getChildren2(nextBranch));
                    }
                                        
                    return classes;                    
                }
                break;

            case BranchType.Class:
                let classname: string =  this.FixWhiteSpaces(node.SearchPattern.replace(/^.*class (.*?)/,"$1"));                
                classname = classname.replace(/^(.*?) extends (.*?) implements (.*?)\s*$/,'$1:$2');
                classname = classname.replace(/^(.*?) extends (.*).*$/,'$1:$2');                
                classname = this.CleanString(classname); 
                
                if(classname.split(" ").length>1)
                    break;
                
                //classname = this.RemoveWhiteSpaces(classname);
                node.Name = classname;                      
                //--need to find start and en lines, to find gettext(range)

                nextBranch = this.InitNewBranch(node);                        
                nextBranch.Name = "Constants";
                nextBranch.Type = BranchType.Constants;
                nextBranch.Icon = 3;
                consts = this.getChildren2(nextBranch);

                nextBranch = this.InitNewBranch(node);                        
                nextBranch.Name = "Properties";
                nextBranch.Type = BranchType.Properties;      
                nextBranch.Icon = 4;
                properties = this.getChildren2(nextBranch);

                nextBranch = this.InitNewBranch(node);                        
                nextBranch.Name = "Methods";
                nextBranch.Type = BranchType.Methods;      
                methods = this.getChildren2(nextBranch);
                
                if(consts[0].Nodes.length > 0)
                    node.Nodes = node.Nodes.concat(consts);

                if(properties[0].Nodes.length > 0)
                    node.Nodes = node.Nodes.concat(properties);

                /*if(methods[0].Nodes.length > 0)
                    node.Nodes = node.Nodes.concat(methods);*/

                //--Собираем класс и возвращаем его. Пока так
                classes.push(node);
                return classes;
                //break;

                case BranchType.Constants:
                    let constants: string[] = phpfile.match(/const .*/gi);
                    if(constants == null)
                        break;
                    for(var i=0; i< constants.length; i++){
                        let constant: string = constants[i].replace(/.*const (.*?) = (.*?)\s*;/,"$1");
                        constant = this.CleanString(constant);
                        let constBranch: Branch = this.InitNewBranch(node);
                        constBranch.Type = BranchType.Const;
                        constBranch.Name = constant;
                        constBranch.Icon = 2;
                        consts.push(constBranch);
                    }
                    node.Nodes = consts;
                    break;
                
                case BranchType.Const://--not using
                    node = null;
                    break;
                
                case BranchType.Properties:
                    let props: string[] = [];
                    let privateP: string[] = phpfile.match(/\s*private\s*.*;/gi);
                    let protectedP: string[] = phpfile.match(/\s*protected\s*.*;/gi);
                    let publicP: string[] = phpfile.match(/\s*public\s*.*;/gi);
                    props = props.concat(privateP != null ? privateP : []);
                    props = props.concat(protectedP != null ? protectedP : []);
                    props = props.concat(publicP != null ? publicP : []);

                    for(var i=0; i< props.length; i++){                        
                        let property: string = '$' + props[i].replace(/\s*.*\$(.*?)\s*;$/,'$1');
                        property = property.replace(/ =.*$/,'');
                        property = this.CleanString(property);
                        let propBranch: Branch = this.InitNewBranch(node);
                        propBranch.Type = BranchType.Const;
                        propBranch.Name = property;
                        propBranch.Icon = 2;
                        properties.push(propBranch);
                    }
                    node.Nodes = properties;
                    break;
                case BranchType.Property:
                    node = null;
                    break;
                case BranchType.Methods:
                    node = null;
                    break;
                case BranchType.Method:
                    node = null;
                    break;                    
        }        

        if(node != null)
            res.push(node);
        return res;
    } 
    
    private InitNewBranch(parent: Branch = null): Branch{
        let branch: Branch = new Branch();
        branch.Type = BranchType.None;
        branch.Name = "";
        branch.StartLine = 0;
        branch.EndLine = 0;
        branch.Icon = 0;
        branch.Nodes = [];
        branch.SearchPattern = "";
        branch.Parent = parent;

        return branch;
    }

    private ClearComments(s: string): string{
        s = s.replace(/\s*(.*?)\s*(\/\/.*).*$/,"$1");
        s = s.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/,"");

        return s;
    }

    private CleanString(s: string): string{
        s = this.ClearComments(s);
        s = s.replace("{","");
        s = s.replace("}","");
        s = s.replace("(","");
        s = s.replace(")","");
        s = s.trim();

        return s;
    }

    private FixWhiteSpaces(s: string): string{
        s = s.replace(/  +/g, ' ');

        return s;
    }

    private RemoveWhiteSpaces(s: string): string{
        s = s.replace(/ /g, '');

        return s;
    }
}