$(document).ready(function(){
  $('.approve').click(function(){

    
   // $(this).parent().append();

    $.post('/api/manage', request, function(data, status){
      if(status == 'success') $(this).parent().remove();
    });
  });
});