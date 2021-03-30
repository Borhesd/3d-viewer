using System;
using System.Collections.Generic;

namespace _3dViewer.Models
{
    public partial class Permissions
    {
        public int Id { get; set; }
        public int Scene { get; set; }
        public string User { get; set; }

        public virtual Scenes SceneNavigation { get; set; }
        public virtual AspNetUsers UserNavigation { get; set; }
    }
}
