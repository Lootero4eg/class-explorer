import {TextEditor} from 'vscode';
import { Branch, ISourceFileModel, BranchType } from './common';

export class PHPSourceFileModel implements ISourceFileModel{
    private editor: TextEditor = null;
    private phpfile: string = null;
    private cleanText: string = null;
    
    constructor(activeEditor: TextEditor){
        this.editor = activeEditor;
        this.phpfile = this.editor.document.getText();
        this.cleanText = this.ClearComments(this.phpfile);
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
        let ifaces:Branch[] = [];
        let classes:Branch[] = [];
        let consts:Branch[] = [];
        let properties:Branch[] = [];
        let methods:Branch[] = [];
        let res: Branch[] = [];
        let tmpContent = null;

        let nextBranch: Branch = null;

        if(node == null){ //--get root
            node = this.InitNewBranch();            
            node.Type = BranchType.Namespace;
            node.Name = "Namespace";            
        }

        switch(node.Type){
            case BranchType.Namespace:
                let namespaces: string[] = this.phpfile.match(/namespace.*/g);
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
                
                if(ifaces != [] && ifaces.length > 0){
                    if(ifaces[0].Nodes.length > 0){
                        nextBranch.Nodes = nextBranch.Nodes.concat(ifaces);
                        res.push(nextBranch);
                    }
                }
                
                nextBranch = this.InitNewBranch();
                nextBranch.Name = "Classes";
                nextBranch.Type = BranchType.Classes;                                                
                classes = this.getChildren2(nextBranch);

                if(classes != [] && classes.length > 0){  
                    if(classes[0].Nodes.length > 0){                 
                        nextBranch.Nodes = nextBranch.Nodes.concat(classes);
                        res.push(nextBranch);          
                    }          
                }                
                return res;

            case BranchType.Interfaces:
                let interfaces: string[] = this.cleanText.match(/interface\s\w+/gi);
                if(interfaces != null && interfaces.length > 0){
                    for(var i = 0; i < interfaces.length; i++) {
                        nextBranch = this.InitNewBranch();
                        nextBranch.Name = "Interface";                        
                        nextBranch.Type = BranchType.Interface;
                        nextBranch.Icon = 2;
                        nextBranch.SearchPattern = interfaces[i];
                        ifaces = ifaces.concat(this.getChildren2(nextBranch));
                        if(ifaces[0].Nodes != [] && ifaces[0].Nodes[0] != null)
                            ifaces[0].Nodes[0].Parent = ifaces[0];
                    }
                                        
                    return ifaces;                    
                }
                break;

            case BranchType.Interface:
                let interfaceName: string =  this.FixWhiteSpaces(node.SearchPattern.replace(/^.*interface\s(.*?)/i,"$1"));                
                interfaceName = this.CleanString(interfaceName); 

                node.Name = interfaceName;    
                node.Icon = 7;                                                                   
                node = this.GetClassOrInterfaceEnvironment(node);
                ifaces.push(node);
                return ifaces;

            case BranchType.Classes:                                
                let classnames: string[] = this.cleanText.match(/class\s*\w+/g);
                if(classnames != null && classnames.length > 0){
                    for(var i = 0; i < classnames.length; i++) {
                        nextBranch = this.InitNewBranch();
                        nextBranch.Name = "Class";                        
                        nextBranch.Type = BranchType.Class;
                        nextBranch.Icon = 1;
                        nextBranch.SearchPattern = classnames[i];
                        classes = classes.concat(this.getChildren2(nextBranch));
                        if(classes[0].Nodes != [] && classes[0].Nodes[0] != null)
                            classes[0].Nodes[0].Parent = classes[0];
                    }
                                        
                    return classes;                    
                }
                break;

            case BranchType.Class:
                let classname: string =  this.FixWhiteSpaces(node.SearchPattern.replace(/^.*class\s(.*?)/,"$1"));                                
                classname = this.CleanString(classname); 
                                
                node.Name = classname;     
                node.Icon = 5;                                                                 
                node = this.GetClassOrInterfaceEnvironment(node);
                
                classes.push(node);
                return classes;                

                case BranchType.Constants:
                    tmpContent = this.GetBracketsContent(this.cleanText,node.Parent.SearchPattern,"{","}");
                    let constants: string[] = tmpContent.match(/const\s*.*/gi);
                    if(constants == null)
                        break;
                    for(var i=0; i< constants.length; i++){
                        let constant: string = constants[i].replace(/const\s*(\w+).*;/i,"$1");
                        constant = this.CleanString(constant);
                        let constBranch: Branch = this.InitNewBranch(node);
                        constBranch.Type = BranchType.Const;
                        constBranch.Name = constant;
                        constBranch.Icon = 2;
                        consts.push(constBranch);
                    }
                    node.Nodes = consts;
                    break;
                
                case BranchType.Const://--not used
                    node = null;
                    break;
                
                case BranchType.Properties:
                    let props: string[] = [];
                    tmpContent = this.GetBracketsContent(this.cleanText,node.Parent.SearchPattern,"{","}");
                    let privateP: string[] = tmpContent.match(/private\s*.*;/gi);
                    let protectedP: string[] = tmpContent.match(/protected\s*.*;/gi);                    
                    let publicP: string[] = tmpContent.match(/public\s*.*;/gi);
                    props = props.concat(privateP != null ? privateP : []);
                    props = props.concat(protectedP != null ? protectedP : []);
                    props = props.concat(publicP != null ? publicP : []);

                    for(var i=0; i< props.length; i++){                        
                        let property: string = props[i].replace(/\s*.*(\$.*?);/,'$1');                        
                        property = this.CleanString(property);
                        let propBranch: Branch = this.InitNewBranch(node);
                        propBranch.Type = BranchType.Const;
                        propBranch.Name = property;
                        propBranch.Icon = 1;
                        properties.push(propBranch);
                    }
                    node.Nodes = properties;
                    break;
                case BranchType.Property://--not used
                    node = null;
                    break;
                case BranchType.Methods:
                    tmpContent = this.GetBracketsContent(this.cleanText,node.Parent.SearchPattern,"{","}");
                    let methodsArr: string[] = tmpContent.match(/function\s*.*/gi);
                    methodsArr = (methodsArr != null ? methodsArr : []);

                    for(var i=0; i< methodsArr.length; i++){
                        let method: string = methodsArr[i].replace(/function\s*(\w+)\s*.*\(.*/i,"$1");
                        method = this.CleanString(method);
                        let methodBranch: Branch = this.InitNewBranch(node);
                        methodBranch.Type = BranchType.Method;
                        methodBranch.Name = method;
                        methodBranch.Icon = 6;
                        methods.push(methodBranch);
                    }
                    node.Nodes = methods;
                    break;
                case BranchType.Method://--not used
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
        s = s.replace(/\s*(.*?)\s*(\/\/.*).*$/g,"$1");
        s = s.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/g,"");
        s = s.replace(/\/\/[\s\S].*$/gm,"");

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

    private GetBracketsContent(content:string, searchPattern: string, open_bracket: string, close_bracket: string): string{
        let startSearchingPosioton: number = content.indexOf(searchPattern);
        let startPosition: number = 0;
        let endPosition: number = 0;
        let innerOpenedBracketsCount = 0;
        
        if(startSearchingPosioton < 0)
            return null;

        startSearchingPosioton += searchPattern.length;

        for(var i = startSearchingPosioton; i < (content.length + startSearchingPosioton)+1; i++){
            if(content[i] == open_bracket && startPosition == 0){
                startPosition = i;
                continue;
            }
            
            if(content[i] == open_bracket){
                innerOpenedBracketsCount++;
            }

            if(content[i] == close_bracket){
                if(innerOpenedBracketsCount>0)
                    innerOpenedBracketsCount--;
                else{
                    endPosition = i;
                    break;
                }
            }
        }

        if(startPosition >= endPosition)
            return null;

        return content.substring(startPosition, endPosition+1);
    }

    private GetClassOrInterfaceEnvironment(node: Branch): Branch{                                                                          
        let consts:Branch[] = [];
        let properties:Branch[] = [];
        let methods:Branch[] = [];

        let nextBranch: Branch = this.InitNewBranch(node);
        nextBranch.Parent = node;                        
        nextBranch.Name = "Constants";
        nextBranch.Type = BranchType.Constants;
        nextBranch.Icon = 3;
        consts = this.getChildren2(nextBranch);

        nextBranch = this.InitNewBranch(node);                        
        nextBranch.Parent = node;
        nextBranch.Name = "Properties";
        nextBranch.Type = BranchType.Properties;      
        nextBranch.Icon = 4;
        properties = this.getChildren2(nextBranch);

        nextBranch = this.InitNewBranch(node);                        
        nextBranch.Parent = node;
        nextBranch.Name = "Methods";
        nextBranch.Type = BranchType.Methods;      
        methods = this.getChildren2(nextBranch);
        
        if(consts[0].Nodes.length > 0)
            node.Nodes = node.Nodes.concat(consts);

        if(properties[0].Nodes.length > 0)
            node.Nodes = node.Nodes.concat(properties);

        if(methods[0].Nodes.length > 0)
            node.Nodes = node.Nodes.concat(methods);

        return node;
    }
}