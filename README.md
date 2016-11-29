# personal-notes-parser
Little tool to export my local personal notes to EverNote


# Overview

Over the years I have been using a simple text file for my personal notes, lately I have been using more and more evernote, so 
I needed to import my notes to evernot, this project uses a simple ruby script to do it.


# Notes Syntax

## Simbols

```
 ~ MAYBE SOMEDAY
 * NEXT ACTIONS
 @category
 []  to do
 [ ] to do
 [*] task completed
 p:<projectname>    
  
```

## Note structure

A note is wrapped betten dash lines , the begining of the dash line should/could contain a timestamp

```
05/13/2008 12:02:00 ------------------------------- 
 @samples p:parser

 this is a sample note , Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla pulvinar lorem et nunc maximus gravida. Pellentesque ac tellus massa. Integer sem mi, placerat nec sapien non, volutpat dictum justo. Nullam id lacus tortor. Phasellus id rutrum magna. Duis sagittis urna vel rhoncus tempor. Cras convallis euismod turpis, a dictum elit convallis non. Praesent volutpat rutrum tincidunt. Donec iaculis ac nunc non mollis. Curabitur malesuada risus ac est fringilla temp

 [ ] task 1
 [] task 2
 [*] task 3 completed



---------------------------------------------------
 ```




