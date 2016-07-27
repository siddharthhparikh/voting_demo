$(document).ready(function(){
  $('.approve').click(function(){

    
   // $(this).parent().append();

    $.post('/api/manage', request, function(data, status){
      console.log(data);
      if(status == 'success') $(this).parent().remove();
    });
  });
});