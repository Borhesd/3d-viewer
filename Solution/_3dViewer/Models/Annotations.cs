using System;
using System.Collections.Generic;

namespace _3dViewer.Models
{
    public partial class Annotations
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public int Scene { get; set; }
        public double Positionx { get; set; }
        public double Positiony { get; set; }
        public double Positionz { get; set; }
        public double Roatationx { get; set; }
        public double Roatationy { get; set; }
        public double Roatationz { get; set; }
        public double Pivotposx { get; set; }
        public double Pivotposy { get; set; }
        public double Pivotposz { get; set; }

        public virtual Scenes SceneNavigation { get; set; }
    }
}
